-- 1. Total de préstamos aprobados por cliente en un rango de fechas

SELECT
    c.id AS cliente_id,
    c.full_name AS nombre_cliente,
    COUNT(la.id) AS cantidad_prestamos,
    SUM(la.requested_amount) AS total_desembolsado
FROM loan_application la
INNER JOIN client c ON c.id = la.client_id
WHERE la.status = 'approved'
    AND la.created_at >= '2026-01-01'
    AND la.created_at < '2026-07-01'
GROUP BY c.id, c.full_name
ORDER BY total_desembolsado DESC;


-- 2. Los 5 clientes con mayor monto aprobado durante el año actual

SELECT
    c.id AS cliente_id,
    c.full_name AS nombre_cliente,
    SUM(la.requested_amount) AS total_aprobado
FROM loan_application la
INNER JOIN client c ON c.id = la.client_id
WHERE la.status = 'approved'
    AND YEAR(la.created_at) = YEAR(CURDATE())
GROUP BY c.id, c.full_name
ORDER BY total_aprobado DESC
LIMIT 5;


-- 3. Consultar las cuotas que están vencidas y todavía no se han pagado

SELECT
    i.id AS cuota_id,
    i.loan_application_id AS solicitud_id,
    c.full_name AS nombre_cliente,
    i.due_date AS fecha_vencimiento,
    i.amount AS monto_cuota,
    DATEDIFF(CURDATE(), i.due_date) AS dias_atraso
FROM installment i
INNER JOIN loan_application la ON la.id = i.loan_application_id
INNER JOIN client c ON c.id = la.client_id
WHERE i.paid = 0
    AND i.due_date < CURDATE()
ORDER BY i.due_date ASC;