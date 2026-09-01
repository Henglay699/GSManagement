  // Helper to safely format ISO strings or Date objects cleanly
export  const formatDate = (dateInput: Date | string) => {
    if (!dateInput) return "N/A";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "N/A";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

 
export const getFirstDayOfMonthString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

// Get the last day of the current month
export const getLastDayOfMonthString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  // Trick: set date to 0 of next month → gives last day of current month
  const lastDay = new Date(year, month, 0).getDate();

  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
};