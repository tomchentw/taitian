export const dateFullFormat = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const toISODateForInput = (date) => {
  const [{ value: year }, , { value: month }, , { value: day }] =
    dateFullFormat.formatToParts(date);
  return `${year}-${month}-${day}`;
};

export const dateTimeFullFormat = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  weekday: "narrow",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
