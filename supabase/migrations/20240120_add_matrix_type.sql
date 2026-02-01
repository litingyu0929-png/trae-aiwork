
ALTER TABLE personas 
ADD COLUMN matrix_type TEXT CHECK (matrix_type IN ('traffic', 'trust', 'harvesting'));

COMMENT ON COLUMN personas.matrix_type IS '矩陣角色定位: traffic(流量/情緒), trust(信任/養號), harvesting(收割/轉化)';

-- 如果需要，可以將既有的 persona_type 遷移過來 (Optional)
-- UPDATE personas SET matrix_type = 'traffic' WHERE persona_type = 'traffic';
-- UPDATE personas SET matrix_type = 'trust' WHERE persona_type = 'authority';
-- UPDATE personas SET matrix_type = 'harvesting' WHERE persona_type = 'conversion';
