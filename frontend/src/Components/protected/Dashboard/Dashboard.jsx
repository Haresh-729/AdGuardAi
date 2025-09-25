import { BarChart3 } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-6 lg:p-8 border border-[var(--border-color)] flex flex-cols items-center justify-between h-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-color)] to-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-primary)]">
                Dashboard
              </h1>
              <p className="text-[var(--text-secondary)] text-lg">
                Welcome back! Here's an overview of your activity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
