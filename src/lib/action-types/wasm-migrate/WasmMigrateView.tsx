import { AddressLink } from '@/components/ui/address-link';
import { JsonViewer } from '@/components/ui/json-viewer';
import type { WasmMigrateMsg } from './WasmMigrateAction';

export function WasmMigrateView({ data }: { data: WasmMigrateMsg }) {
  const { contract_addr, new_code_id, msg } = data.wasm.migrate;

  // Decode base64 message if needed
  let decodedMsg = msg;
  if (typeof msg === 'string') {
    try {
      decodedMsg = JSON.parse(atob(msg));
    } catch (e) {
      decodedMsg = { error: 'Failed to decode message', raw: msg };
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Contract</div>
          <AddressLink address={contract_addr} short={true} isSmartContract={true} />
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">New Code ID</div>
          <div className="text-sm">{new_code_id}</div>
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Migrate Message</div>
          <div className="overflow-hidden rounded-lg border">
            <JsonViewer data={decodedMsg} />
          </div>
        </div>
      </div>
    </div>
  );
}
