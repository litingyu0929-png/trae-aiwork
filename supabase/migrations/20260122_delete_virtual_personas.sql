-- Delete virtual personas, keeping only LeLe, AJie, AXiang

DELETE FROM public.personas
WHERE name IN (
  '科技宅男小明',
  '投資理財莎莎',
  '生活觀察家老王',
  '美妝博主小美'
);
