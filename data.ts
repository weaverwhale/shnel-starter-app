interface ChannelData {
  channel: string;
  total_spend: number;
  total_revenue: number;
  roas: number;
}

interface ApiResponse {
  data: ChannelData[][];
  messages: ChannelData[][];
  hasStructuredData: boolean;
}

export const fetchData = async (startDate: string, endDate: string): Promise<ApiResponse> => {
  // fetch queries from api
  const QUERIES: string[] = [`SELECT
pjt.channel AS channel,
COALESCE(SUM(pjt.spend), 0) AS total_spend,
COALESCE(SUM(pjt.order_revenue), 0) AS total_revenue,
COALESCE(
  SUM(pjt.order_revenue) / nullIf(SUM(pjt.spend), 0),
  0
) AS roas
FROM
pixel_joined_tvf () AS pjt
WHERE
pjt.model = 'Triple Attribution'
AND pjt.attribution_window = 'lifetime'
AND pjt.event_date BETWEEN '${startDate}' AND '${endDate}'
GROUP BY
pjt.channel
ORDER BY
roas DESC`];

  const data = await fetch('http://localhost/api/v2/shnel/get-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      queries: QUERIES,
      shopId: 'westside-barbell.myshopify.com',
    }),
  });

  return data.json();
}
