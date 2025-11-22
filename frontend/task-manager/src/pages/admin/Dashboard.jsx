import React, { useContext, useEffect, useState } from "react";
import { useUserAuth } from "../../hooks/useUserAuth";
import { UserContext } from "../../context/userContext";
import DashBoardLayout from "../../components/layout/DashBoardLayout";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import moment from "moment";
import InfoCard from "../../components/cards/InfoCard";
import { addThousandsSeperator } from "../../utils/helper";
import { LuArrowRight } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import TableListTable from "../../components/layout/TableListTable";
import CustomPieChart from "../../components/charts/CustomPieChart";
import CustomBarChart from "../../components/charts/CustomBarChart";

const COLORS = ["#8D51FF", "#00B8DB", "#7BCE00"];

const DashBoard = () => {
  useUserAuth();

  const { user } = useContext(UserContext);

  const [dashboardData, setDashboardData] = useState(null);
  const [pieChartData, setPieChartData] = useState([]); // default []
  const [barChartData, setBarChartData] = useState([]); // default []

  const prepareChartData = (data) => {
    // defensive
    if (!data) {
      setPieChartData([]);
      setBarChartData([]);
      return;
    }

    // --- PIE: map counts -> statuses (use exact labels your chart expects) ---
    const counts = data.counts || {};
    const pieData = [
      { status: "Pending", count: counts.pending ?? 0 },
      { status: "In Progress", count: counts.inProgress ?? 0 },
      { status: "Completed", count: counts.completed ?? 0 },
    ];
    setPieChartData(pieData);

    // --- BAR: compute priority counts by scanning recent tasks ---
    // recent is an array of task objects
    const recent = Array.isArray(data.recent) ? data.recent : [];

    const priorityCounts = recent.reduce(
      (acc, t) => {
        const p = (t.priority || "").toString();
        if (!p) return acc;
        if (p.toLowerCase() === "low") acc.Low += 1;
        else if (p.toLowerCase() === "medium") acc.Medium += 1;
        else if (p.toLowerCase() === "high") acc.High += 1;
        else {
          // count unknown priorities under 'Low' (or ignore)
        }
        return acc;
      },
      { Low: 0, Medium: 0, High: 0 }
    );

    const barData = [
      { priority: "Low", count: priorityCounts.Low },
      { priority: "Medium", count: priorityCounts.Medium },
      { priority: "High", count: priorityCounts.High },
    ];
    setBarChartData(barData);
  };

  const getDashBoardData = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_DASHBOARD_DATA);
      if (response?.data) {
        setDashboardData(response.data);
        prepareChartData(response.data);
        console.log("dashboardData:", response.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const navigate = useNavigate();
  const onSeeMore = () => {
    navigate("/admin/tasks");
  };

  useEffect(() => {
     
    getDashBoardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeMenu = "Dashboard";

  const counts = dashboardData?.counts || {};
  const totalTasks = counts.total ?? 0;
  const pendingTasks = counts.pending ?? 0;
  const inProgressTasks = counts.inProgress ?? 0;
  const completedTasks = counts.completed ?? 0;

  return (
    <DashBoardLayout activeMenu={activeMenu}>
      <div className="card my-5">
        <div>
          <div className="col-span-3">
            <h2 className="text-xl md:text-2xl">Good Morning! {user?.name}</h2>
            <p className="text-xs md:text-[13px] text-gray-400 mt-1.5">
              {moment().format("dddd Do MMM YYYY")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-6 mt-5">
          <InfoCard label="Total Tasks" value={addThousandsSeperator(totalTasks)} color="bg-primary" />

          <InfoCard label="Pending Tasks" value={addThousandsSeperator(pendingTasks)} color="bg-violet-500" />

          <InfoCard label="In Progress" value={addThousandsSeperator(inProgressTasks)} color="bg-yellow-500" />

          <InfoCard label="Completed" value={addThousandsSeperator(completedTasks)} color="bg-green-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 my-4 md:my-6">
       
       <div>
        <div className="card">
          <div className="flex items-center justify-between">
            <h5 className="">Task Distribution</h5>
          </div>

          <CustomPieChart data={pieChartData} colors={COLORS} />
    
        </div>
        </div>
       
       <div>
        <div className="card">
          <div className="flex items-center justify-between">
            <h5 className="">Task Distribution</h5>
          </div>

          <CustomBarChart
  data={barChartData}
  colors={COLORS}
  xKey="priority"
  barKey="count"
/>

    
        </div>
        </div>

        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="text-lg">Recent Tasks</h5>
              <button className="card-btn" onClick={onSeeMore}>
                See All <LuArrowRight className="text-base" />
              </button>
            </div>

            <TableListTable tableData={dashboardData?.recent || []} />
          </div>
        </div>
      </div>
    </DashBoardLayout>
  );
};

export default DashBoard;
