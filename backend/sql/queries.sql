-- 1. Total de préstamos aprobados por cliente en un rango de fechas

SELECT
    cliente.id                           AS id_cliente,
    cliente.full_name                    AS nombre_completo_cliente,
    COUNT(solicitud.id)                  AS cantidad_prestamos_aprobados,
    SUM(solicitud.requested_amount)      AS monto_total_desembolsado
FROM loan_application AS solicitud
INNER JOIN client AS cliente
    ON cliente.id = solicitud.client_id
WHERE solicitud.status = 'approved'
    AND solicitud.created_at >= '2026-01-01'   
    AND solicitud.created_at <  '2026-07-01' 
GROUP BY cliente.id, cliente.full_name
ORDER BY monto_total_desembolsado DESC;


-- 2. Los 5 clientes con mayor monto aprobado durante el año actual

SELECT
    cliente.id                           AS id_cliente,
    cliente.full_name                    AS nombre_completo_cliente,
    SUM(solicitud.requested_amount)      AS monto_total_aprobado_anio_actual
FROM loan_application AS solicitud
INNER JOIN client AS cliente
    ON cliente.id = solicitud.client_id
WHERE solicitud.status = 'approved'
    AND YEAR(solicitud.created_at) = YEAR(CURDATE())
GROUP BY cliente.id, cliente.full_name
ORDER BY monto_total_aprobado_anio_actual DESC
LIMIT 5;


-- 3. Cuotas vencidas que todavía no se han pagado

SELECT
    cuota.id                                   AS id_cuota,
    cuota.loan_application_id                  AS id_solicitud_prestamo,
    cliente.full_name                          AS nombre_completo_cliente,
    cuota.due_date                             AS fecha_vencimiento,
    cuota.amount                               AS monto_cuota_pendiente,
    DATEDIFF(CURDATE(), cuota.due_date)        AS dias_de_atraso
FROM installment AS cuota
INNER JOIN loan_application AS solicitud
    ON solicitud.id = cuota.loan_application_id
INNER JOIN client AS cliente
    ON cliente.id = solicitud.client_id
WHERE cuota.paid = 0                          
    AND cuota.due_date < CURDATE()         
ORDER BY cuota.due_date ASC;          