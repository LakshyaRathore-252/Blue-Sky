import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchChartData = async () => {
    const { data } = await axios.get("http://localhost:5000"); // Replace with your actual endpoint
    return data;
};

const useChartData = () => {
    return useQuery({
        queryKey: ["chartData"],
        queryFn: fetchChartData,
    });
};

export default useChartData;
