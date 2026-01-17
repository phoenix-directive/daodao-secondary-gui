import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Base interface for all action types.
 * Each action type should implement this interface to provide:
 * - Type guard for identifying the message
 * - Form editor component
 * - View/preview component
 * - Metadata (title, icon, etc.)
 */
export interface ActionType<T = any> {
  /** Unique identifier for this action type */
  id: string;

  /** Display name for this action type */
  name: string;

  /** Icon to represent this action type */
  icon: LucideIcon;

  /** Type guard function to identify if a message matches this action type */
  guard: (data: any) => data is T;

  /** Get display title for the action */
  getTitle: (data: T) => string;

  /** Get subtitle/description for preview (optional) */
  getSubtitle?: (data: T) => string | ReactNode;

  /** Whether the preview should be expandable */
  expandable: boolean;

  /** Form component for editing the action */
  FormEditor: React.ComponentType<{
    data: T;
    onUpdate: (path: string[], value: any) => void;
    onUpdateMulti?: (updates: Array<{ path: string[]; value: any }>) => void;
  }>;

  /** Preview/view component for displaying the action (used in proposal messages) */
  ViewComponent?: React.ComponentType<{
    data: T;
  }>;

  /** Render parsed content for expanded view (optional, overrides ViewComponent if provided) */
  renderParsed?: (data: T) => ReactNode;
}

/**
 * Registry for managing all action types.
 * Provides methods to register, lookup, and match action types.
 */
export class ActionRegistry {
  private actionTypes: Map<string, ActionType> = new Map();
  private orderedActionTypes: ActionType[] = [];

  /**
   * Register a new action type
   */
  register(actionType: ActionType): void {
    this.actionTypes.set(actionType.id, actionType);
    this.orderedActionTypes.push(actionType);
  }

  /**
   * Register multiple action types at once
   */
  registerAll(actionTypes: ActionType[]): void {
    actionTypes.forEach((actionType) => this.register(actionType));
  }

  /**
   * Get an action type by ID
   */
  getById(id: string): ActionType | undefined {
    return this.actionTypes.get(id);
  }

  /**
   * Find the matching action type for a given message data.
   * Returns the first action type whose guard returns true.
   */
  match(data: any): ActionType | undefined {
    return this.orderedActionTypes.find((actionType) => actionType.guard(data));
  }

  /**
   * Get all registered action types
   */
  getAll(): ActionType[] {
    return [...this.orderedActionTypes];
  }

  /**
   * Get message type info for a given message (for backwards compatibility)
   */
  detectMessageType(data: any): { type: string; name: string; icon?: string } {
    const actionType = this.match(data);
    if (actionType) {
      return {
        type: actionType.id,
        name: actionType.name,
      };
    }
    return { type: 'unknown', name: 'Unknown Message' };
  }
}

/**
 * Global action registry instance
 */
export const actionRegistry = new ActionRegistry();
