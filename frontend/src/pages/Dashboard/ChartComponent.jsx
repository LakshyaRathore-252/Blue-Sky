"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

const ChartComponent = ({ data }) => {

  console.log(data);
  // Check if data is available
  if (!data || !data.chartData) {
    return <div>No data available</div>;
  }

  // Format the date for the XAxis
  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM dd"); // Format as "Jan 01"
  };

  return (
    <>
      <div className="flex justify-between items-center ">
        <h2 className="text-5xl font-bold gradient-title">Dashboard</h2>
      </div>

      <div className="space-y-6 ">
        <Card className="bg-[#1E2936]">
          <CardHeader>
            <CardTitle>Post Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full ">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={formatDate} // Format the date on the XAxis
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `${value} impressions`} // Format tooltip
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f97316"
                    name="Impressions"
                    strokeWidth={2}
                  />
                  {!isNaN(data.averageImpressions) && (
                    <ReferenceLine
                      y={data.averageImpressions}
                      label={{
                        value: `Avg: ${data.averageImpressions.toFixed(2)}`,
                        position: "insideBottomRight",
                        fill: "red",
                        fontSize: 12,
                      }}
                      stroke="red"
                      strokeDasharray="3 3"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChartComponent;