const DateSelector = () => {
  const today = new Date();
  const formatted = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <p className="text-sm text-muted-foreground">{formatted}</p>
  );
};

export default DateSelector;
