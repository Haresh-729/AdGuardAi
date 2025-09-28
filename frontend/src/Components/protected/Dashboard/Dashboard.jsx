import { BarChart3 } from "lucide-react";
import { useSelector } from "react-redux";
import { selectAccount } from "../../../App/DashboardSlice";
import AdminFeatures from "./utils/AdminFeatures";
import UserFeatures from "./utils/UserFeatures";
const Dashboard = () => {
  const user = useSelector(selectAccount);
  const isAdmin = user?.role === "admin";
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {isAdmin ? <AdminFeatures /> : <UserFeatures />}
      </div>
    </div>
  );
};

export default Dashboard;
