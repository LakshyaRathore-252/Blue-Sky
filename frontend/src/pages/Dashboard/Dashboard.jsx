import React, { useState } from "react";
import ChartComponent from "./ChartComponent";
import BarChartComponent from "./BarChartComponent";
import { useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import MyPieChart from "./MyPieChart";
import ProfileHeaderSkeleton from "@/components/skeletons/ProfileHeaderSkeleton";
const Dashboard = () => {
  const { data: authUser } = useQuery({ queryKey: ["chartData"] });
  const {
    data: chartData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["chartData"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/posts/countImpressions"); // Replace with your actual endpoint
        const data = await res.json();
        console.log(data);
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  });

  if (isLoading) {
    return <div className="space-y-4 mt-10 p-4  w-full mx-auto">
      <div className="h-72 w-full bg-gray-200 animate-pulse rounded-lg"></div>

      <div className="flex items-center justify-between w-full space-x-4 mt-5 bg-[#1E2936]">
        <div className="h-20 w-1/2 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="h-20 w-1/2 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    </div>
      ;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="p-6 w-[100%] flex flex-col space-y-4">
      <ChartComponent data={chartData?.data} />

      {/* Total Interactions */}
      <div className="flex items-center justify-between w-full space-x-4 mt-5 bg-[#1E2936]">
        <Card className="w-[50%] p-4 text-center ">
          <h2 className="text-lg font-semibold">Total Likes</h2>
          <p>{chartData?.data?.totalLikes}</p>
        </Card>

        <Card className="w-[50%] p-4 text-center">
          <h2 className="text-lg font-semibold">Total Comments</h2>
          <p>{chartData?.data?.totalComments}</p>
        </Card>
      </div>
      <div className="flex items-center justify-center w-full space-x-4 mt-5 " >

        <MyPieChart />
      </div>


    </div>
  );
};

export default Dashboard;
