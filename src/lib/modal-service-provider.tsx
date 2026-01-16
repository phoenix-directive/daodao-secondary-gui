/**
 * ModalServiceProvider Component
 *
 * Renders all modals opened via the modal service.
 * Should be placed at the root of your application.
 */

import { modalService, ModalState } from '@/lib/modal-service';
import { ReactNode } from 'react';

export function ModalServiceProvider({ children }: { children: ReactNode }) {
  const modals = modalService.getModals();

  return (
    <>
      {children}
      {modals.value.map((modalState: ModalState) => {
        const Component = modalState.config.component;

        const handleOpenChange = (open: boolean) => {
          if (!open) {
            modalService.close(modalState.id, null);
          }
        };

        const handleResolve = (result: any) => {
          modalService.close(modalState.id, result);
        };

        const handleReject = (reason?: any) => {
          modalState.reject(reason);
          modalService.close(modalState.id, null);
        };

        return (
          <Component
            key={modalState.id}
            open={!modalState.isClosing}
            onOpenChange={handleOpenChange}
            onResolve={handleResolve}
            onReject={handleReject}
            modalProps={modalState.config.props}
          />
        );
      })}
    </>
  );
}
