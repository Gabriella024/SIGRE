import ConfigSection from "./ConfigSection";
import { PendingIntegrationNotice } from "@/components/ui/pending-integration";

export default function PlantillasCorreoSection() {
  return (
    <ConfigSection
      id="plantillas-correo"
      title="Plantillas de correo"
      description="Administra los mensajes automáticos que envía el sistema."
    >
      <PendingIntegrationNotice>
        La gestión de plantillas de correo se habilitará cuando exista la integración con Supabase.
      </PendingIntegrationNotice>
    </ConfigSection>
  );
}
