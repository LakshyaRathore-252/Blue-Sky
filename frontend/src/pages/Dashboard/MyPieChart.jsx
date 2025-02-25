import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

// const data = [
//   { name: 'Group A', value: 400 },
//   { name: 'Group B', value: 300 },
//   { name: 'Group C', value: 300 },
//   { name: 'Group D', value: 200 },
// ];

const COLORS = ['#0088FE', '#00C49F'];

const MyPieChart = () => {
  const { data: authUser } = useQuery({ queryKey: ["pieChartData"] });

  const {
    data: pieChartData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["pieChartData"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/posts/getFollowersFollowing"); // Replace with your actual endpoint
        const data = await res.json();
        console.log("PieChartdata", data);
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
    return <div className="flex flex-col items-center space-y-4 mt-10">
      {/* Pie Chart */}
      <div className="relative">
        <div className="w-40 h-40 bg-gray-200 animate-pulse rounded-full"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gray-300 animate-pulse rounded-full"></div>
        </div>
      </div>

      

    </div>

  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  console.log("PieChartData", pieChartData?.data);

  return (
    <PieChart width={400} height={400}>
      <Pie Pie
        data={pieChartData?.data}
        cx={200}
        cy={200}
        labelLine={false}
        label={({ name, value }) => `${name}: ${value}`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {
          pieChartData?.data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))
        }
      </Pie >
      <Tooltip />
      <Legend />
    </PieChart >
  );
};

export default MyPieChart;
