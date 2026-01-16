/**
 * Modal Service Core
 *
 * Imperative API for opening modals with Promise-based resolution.
 * Allows you to await modal results from anywhere in the application.
 *
 * @example
 * ```tsx
 * import { modalService } from '@/lib/modal-service-core';
 * import { AddressInputModal } from '@/components/modals/address-input-modal';
 *
 * // Await the result
 * const address = await modalService.open<string>(AddressInputModal, {
 *   title: 'Enter Address',
 *   description: 'Please provide a Terra address',
 * });
 *
 * if (address) {
 *   console.log('Address entered:', address);
 * }
 * ```
 */

import { signal } from '@preact/signals-react';
import { ComponentType } from 'react';

export interface ModalConfig<TResult = any, TProps = any> {
  component: ComponentType<ModalComponentProps<TResult, TProps>>;
  props?: TProps;
  onClose?: (result: TResult | null) => void;
}

export interface ModalComponentProps<TResult = any, TProps = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (result: TResult) => void;
  onReject: (reason?: any) => void;
  modalProps?: TProps;
}

export interface ModalState<TResult = any, TProps = any> {
  id: string;
  config: ModalConfig<TResult, TProps>;
  resolve: (result: TResult | null) => void;
  reject: (reason?: any) => void;
  isClosing?: boolean;
}

class ModalService {
  private modals = signal<ModalState[]>([]);
  private modalIdCounter = 0;

  /**
   * Open a modal imperatively and await its result
   *
   * @param component - The modal component to render
   * @param props - Props to pass to the modal component
   * @returns Promise that resolves with the modal result or null if cancelled
   */
  open<TResult = any, TProps = any>(
    component: ComponentType<ModalComponentProps<TResult, TProps>>,
    props?: TProps,
  ): Promise<TResult | null> {
    return new Promise<TResult | null>((resolve, reject) => {
      const id = `modal-${++this.modalIdCounter}`;

      const modalState: ModalState<TResult, TProps> = {
        id,
        config: {
          component,
          props,
        },
        resolve,
        reject: () => resolve(null),
      };

      this.modals.value = [...this.modals.value, modalState];
    });
  }

  /**
   * Close a modal by ID
   * Marks the modal as closing first, then removes it after animation completes
   */
  close(id: string, result: any = null) {
    const modal = this.modals.value.find((m) => m.id === id);
    if (modal && !modal.isClosing) {
      // Mark as closing to trigger animation
      this.modals.value = this.modals.value.map((m) =>
        m.id === id ? { ...m, isClosing: true } : m,
      );

      // Wait for animation to complete before resolving and removing
      setTimeout(() => {
        const stillExists = this.modals.value.find((m) => m.id === id);
        if (stillExists) {
          stillExists.resolve(result);
          this.modals.value = this.modals.value.filter((m) => m.id !== id);
        }
      }, 250); // 250ms to allow close animation
    }
  }

  /**
   * Close all modals
   */
  closeAll() {
    this.modals.value.forEach((modal) => modal.resolve(null));
    this.modals.value = [];
  }

  /**
   * Get the current modals signal for rendering
   */
  getModals() {
    return this.modals;
  }
}

export const modalService = new ModalService();
