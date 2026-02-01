-- TRUNCATE all user-related tables to reset the system
TRUNCATE TABLE
  public.work_task_logs,
  public.task_logs,
  public.daily_tasks,
  public.work_tasks,
  public.contents,
  public.staff_persona_assignments,
  public.interactions,
  public.assets,
  public.accounts,
  public.task_templates,
  public.personas,
  public.notifications,
  public.proxy_logs,
  public.profiles,
  public.crawler_logs,
  public.system_logs,
  public.rss_feeds
  RESTART IDENTITY CASCADE;
