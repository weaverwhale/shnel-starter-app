interface ColumnData {
  name: string;
  value: (string | number)[];
}

export interface ApiResponse {
  data: ColumnData[][];
  messages: any[];
  hasStructuredData: boolean;
  queries?: string[];
}

export const fetchData = async (startDate: string, endDate: string): Promise<ApiResponse> => {
  // Queries to fetch product analytics and blended stats
  const QUERIES: string[] = [
    `
    SELECT
      pat.product_id AS product_id,
      pat.product_name AS product_name,
      SUM(pat.total_items_sold) AS total_items_sold
    FROM
      product_analytics_tvf() AS pat
    WHERE
      pat.event_date BETWEEN toStartOfYear(CURRENT_DATE()) - INTERVAL 1 YEAR AND toStartOfYear(CURRENT_DATE()) - 1
    GROUP BY
      pat.product_id,
      pat.product_name
    ORDER BY
      total_items_sold DESC
    LIMIT
      10;
    `,
    `
    SELECT
      formatDateTime(bs.event_date, '%Y-%m') AS month,
      SUM(bs.total_sales) AS total_sales,
      SUM(bs.gross_product_sales) AS gross_product_sales,
      SUM(bs.orders_count) AS orders_count
    FROM
      blended_stats_tvf() AS bs
    WHERE
      bs.event_date BETWEEN toStartOfMonth(CURRENT_DATE()) - INTERVAL 12 MONTH AND toStartOfMonth(CURRENT_DATE()) - 1
    GROUP BY
      month
    ORDER BY
      month DESC;
    `,
  ];

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
      dynamicData: true,
    }),
  });

  return data.json();
}