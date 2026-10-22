-- Adiciona coluna contract_paid_through a local_license_state.
-- Registra a data real do contrato informada pelo Control Plane (paid_through)
-- para exibicao no painel como "Contrato vigente ate", sem alterar a logica de
-- lease criptografico (sempre 7 dias, renovado por heartbeat).

ALTER TABLE public.local_license_state
  ADD COLUMN IF NOT EXISTS contract_paid_through DATE;
