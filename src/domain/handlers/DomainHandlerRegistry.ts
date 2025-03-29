/**
 * @fileoverview Registry for domain handlers.
 *
 * Provides a registry for domain-specific handlers that can be
 * looked up by domain. This allows for a flexible, extensible
 * system of domain handlers.
 */

import { DomainHandler } from './DomainHandler';
import { EnhancedIntent, LightningDomain } from '../intents/entities/EnhancedIntent';
import logger from '../../core/logging/logger';

/**
 * Registry for domain handlers
 */
export class DomainHandlerRegistry {
  private handlers: Map<LightningDomain, DomainHandler>;
  private defaultHandler: DomainHandler | null = null;

  /**
   * Create a new domain handler registry
   */
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Register a handler for a domain
   * @param domain The domain to register the handler for
   * @param handler The handler to register
   */
  register(domain: LightningDomain, handler: DomainHandler): void {
    logger.debug(`Registering handler for domain: ${domain}`, {
      component: 'domain-handler-registry',
      domain,
    });

    this.handlers.set(domain, handler);
  }

  /**
   * Register a default handler for unknown domains
   * @param handler The default handler
   */
  registerDefault(handler: DomainHandler): void {
    logger.debug('Registering default handler', {
      component: 'domain-handler-registry',
    });

    this.defaultHandler = handler;
  }

  /**
   * Get a handler for a domain
   * @param domain The domain to get a handler for
   * @returns The handler for the domain, or the default handler if none is registered
   * @throws Error if no handler is found and no default handler is registered
   */
  getHandler(domain: LightningDomain): DomainHandler {
    const handler = this.handlers.get(domain) || this.defaultHandler;

    if (!handler) {
      throw new Error(`No handler registered for domain: ${domain}`);
    }

    return handler;
  }

  /**
   * Get a handler for an intent
   * @param intent The intent to get a handler for
   * @returns The appropriate handler for the intent
   * @throws Error if no handler is found
   */
  getHandlerForIntent(intent: EnhancedIntent): DomainHandler {
    // First try to get a handler for the domain
    const domainHandler = this.handlers.get(intent.domain);

    // If we found a handler and it can handle the intent, return it
    if (domainHandler && domainHandler.canHandle(intent)) {
      return domainHandler;
    }

    // Otherwise, look for any handler that can handle the intent
    for (const handler of this.handlers.values()) {
      if (handler.canHandle(intent)) {
        return handler;
      }
    }

    // If we still don't have a handler, use the default
    if (this.defaultHandler) {
      return this.defaultHandler;
    }

    // If we get here, we don't have a handler
    throw new Error(`No handler found for intent: ${intent.domain}/${intent.operation}`);
  }
}
