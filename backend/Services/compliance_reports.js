const { supabase } = require("../config/config");

const analysisResultsTable = "analysis_results";
const advertisementTable = "advertisement";
const usersTable = "users";

const getUserReports = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(analysisResultsTable)
      .select(`
        *,
        advertisement:advertisement_id (
          title,
          description,
          type,
          created_at
        ),
        approved_by_user:approved_by (
          name,
          email
        ),
        media:media_id (public_url)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error in getUserReports:", error);
    throw new Error(error.message || "Failed to fetch user reports");
  }
};

const getAllReports = async () => {
  try {
    const { data, error } = await supabase
      .from(analysisResultsTable)
      .select(`
        *,
        advertisement:advertisement_id (
          title,
          description,
          type,
          created_at
        ),
        user:user_id (
          name,
          email,
          sector
        ),
        approved_by_user:approved_by (
          name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error in getAllReports:", error);
    throw new Error(error.message || "Failed to fetch all reports");
  }
};

const approveAdvertisement = async (analysisResultsId, adminId, reason = null) => {
  try {
    const { data, error } = await supabase
      .from(analysisResultsTable)
      .update({
        admin_verdict: "approved",
        approved_by: adminId,
        admin_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq("analysis_results_id", analysisResultsId)
      .select("*, advertisement:advertisement_id(title)")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Report not found");

    return data;
  } catch (error) {
    console.error("Error in approveAdvertisement:", error);
    throw new Error(error.message || "Failed to approve advertisement");
  }
};

const rejectAdvertisement = async (analysisResultsId, adminId, reason = null) => {
  try {
    const { data, error } = await supabase
      .from(analysisResultsTable)
      .update({
        admin_verdict: "rejected",
        approved_by: adminId,
        admin_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq("analysis_results_id", analysisResultsId)
      .select("*, advertisement:advertisement_id(title)")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Report not found");

    return data;
  } catch (error) {
    console.error("Error in rejectAdvertisement:", error);
    throw new Error(error.message || "Failed to reject advertisement");
  }
};

module.exports = {
  getUserReports,
  getAllReports,
  approveAdvertisement,
  rejectAdvertisement
};