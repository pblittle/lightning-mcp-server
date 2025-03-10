import logger from '../../utils/logger';

/**
 * Type definition for command parameter validation
 */
export interface CommandParameterValidation {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  validate?: (value: any) => boolean;
}

/**
 * Type definition for command validation
 */
export interface CommandValidation {
  description: string;
  isWriteCommand: boolean;
  parameters: Record<string, CommandParameterValidation>;
  lnServiceMethod: string;
}

/**
 * Whitelist of allowed LND commands with their validation rules
 */
export const ALLOWED_COMMANDS: Record<string, CommandValidation> = {
  // Read-only commands
  getWalletInfo: {
    description: 'Get information about the LND node',
    isWriteCommand: false,
    parameters: {},
    lnServiceMethod: 'getWalletInfo',
  },
  getChainBalance: {
    description: 'Get on-chain wallet balance',
    isWriteCommand: false,
    parameters: {},
    lnServiceMethod: 'getChainBalance',
  },
  getChannelBalance: {
    description: 'Get lightning channel balance',
    isWriteCommand: false,
    parameters: {},
    lnServiceMethod: 'getChannelBalance',
  },
  getChannels: {
    description: 'Get list of open channels',
    isWriteCommand: false,
    parameters: {},
    lnServiceMethod: 'getChannels',
  },
  getPeers: {
    description: 'Get list of connected peers',
    isWriteCommand: false,
    parameters: {},
    lnServiceMethod: 'getPeers',
  },
  getNetworkInfo: {
    description: 'Get information about the lightning network',
    isWriteCommand: false,
    parameters: {},
    lnServiceMethod: 'getNetworkInfo',
  },
  getClosedChannels: {
    description: 'Get list of closed channels',
    isWriteCommand: false,
    parameters: {},
    lnServiceMethod: 'getClosedChannels',
  },
  getPendingChannels: {
    description: 'Get list of pending channels',
    isWriteCommand: false,
    parameters: {},
    lnServiceMethod: 'getPendingChannels',
  },
  getInvoices: {
    description: 'Get list of invoices',
    isWriteCommand: false,
    parameters: {
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of invoices to return',
        validate: (value) => value > 0,
      },
    },
    lnServiceMethod: 'getInvoices',
  },
  getPayments: {
    description: 'Get list of payments',
    isWriteCommand: false,
    parameters: {
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of payments to return',
        validate: (value) => value > 0,
      },
    },
    lnServiceMethod: 'getPayments',
  },
  decodePaymentRequest: {
    description: 'Decode a payment request',
    isWriteCommand: false,
    parameters: {
      request: {
        type: 'string',
        required: true,
        description: 'Payment request to decode',
      },
    },
    lnServiceMethod: 'decodePaymentRequest',
  },

  // Write commands (disabled by default)
  createInvoice: {
    description: 'Create a new invoice',
    isWriteCommand: true,
    parameters: {
      tokens: {
        type: 'number',
        required: true,
        description: 'Amount in tokens',
        validate: (value) => value > 0,
      },
      description: {
        type: 'string',
        required: false,
        description: 'Description of the invoice',
      },
      expires_at: {
        type: 'string',
        required: false,
        description: 'ISO 8601 date string when the invoice expires',
      },
    },
    lnServiceMethod: 'createInvoice',
  },
  payViaPaymentRequest: {
    description: 'Pay an invoice',
    isWriteCommand: true,
    parameters: {
      request: {
        type: 'string',
        required: true,
        description: 'Payment request to pay',
      },
      max_fee: {
        type: 'number',
        required: false,
        description: 'Maximum fee to pay in tokens',
        validate: (value) => value >= 0,
      },
    },
    lnServiceMethod: 'payViaPaymentRequest',
  },
};

/**
 * Validate if a command is allowed
 * @param commandName Name of the command to validate
 * @param allowWriteCommands Whether write commands are allowed
 * @returns Validation result with command details or error
 */
export function validateCommand(
  commandName: string,
  allowWriteCommands: boolean
): { isValid: boolean; error?: string; command?: CommandValidation } {
  // Check if command exists in whitelist
  if (!ALLOWED_COMMANDS[commandName]) {
    return {
      isValid: false,
      error: `Command '${commandName}' is not allowed. Allowed commands: ${Object.keys(
        ALLOWED_COMMANDS
      ).join(', ')}`,
    };
  }

  const command = ALLOWED_COMMANDS[commandName];

  // Check if write command is allowed
  if (command.isWriteCommand && !allowWriteCommands) {
    return {
      isValid: false,
      error: `Write command '${commandName}' is not allowed. Set ALLOW_WRITE_COMMANDS=true to enable write commands.`,
    };
  }

  return {
    isValid: true,
    command,
  };
}

/**
 * Validate command parameters
 * @param command Command validation rules
 * @param params Parameters to validate
 * @returns Validation result with validated parameters or error
 */
export function validateParameters(
  command: CommandValidation,
  params: Record<string, any>
): { isValid: boolean; error?: string; validatedParams?: Record<string, any> } {
  const validatedParams: Record<string, any> = {};
  const errors: string[] = [];

  // Check for required parameters
  for (const [paramName, validation] of Object.entries(command.parameters)) {
    if (validation.required && params[paramName] === undefined) {
      errors.push(`Required parameter '${paramName}' is missing`);
      continue;
    }

    // Skip validation if parameter is not provided and not required
    if (params[paramName] === undefined) {
      continue;
    }

    const value = params[paramName];

    // Validate parameter type
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== validation.type) {
      errors.push(
        `Parameter '${paramName}' should be of type '${validation.type}', but got '${actualType}'`
      );
      continue;
    }

    // Run custom validation if provided
    if (validation.validate && !validation.validate(value)) {
      errors.push(`Parameter '${paramName}' failed validation: ${validation.description}`);
      continue;
    }

    // Parameter is valid, add to validated params
    validatedParams[paramName] = value;
  }

  // Check for unknown parameters
  for (const paramName of Object.keys(params)) {
    if (!command.parameters[paramName]) {
      errors.push(
        `Unknown parameter '${paramName}' is not allowed for command '${command.description}'`
      );
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join('; '),
    };
  }

  return {
    isValid: true,
    validatedParams,
  };
}

/**
 * Validate a command and its parameters
 * @param commandName Name of the command to validate
 * @param params Parameters to validate
 * @param allowWriteCommands Whether write commands are allowed
 * @returns Validation result with command details and validated parameters or error
 */
export function validateCommandAndParameters(
  commandName: string,
  params: Record<string, any>,
  allowWriteCommands: boolean
): {
  isValid: boolean;
  error?: string;
  command?: CommandValidation;
  validatedParams?: Record<string, any>;
} {
  // Validate command
  const commandValidation = validateCommand(commandName, allowWriteCommands);
  if (!commandValidation.isValid) {
    return {
      isValid: false,
      error: commandValidation.error,
    };
  }

  // Validate parameters
  const paramValidation = validateParameters(commandValidation.command!, params);
  if (!paramValidation.isValid) {
    return {
      isValid: false,
      error: paramValidation.error,
    };
  }

  logger.debug(
    {
      command: commandName,
      params: paramValidation.validatedParams,
      isWriteCommand: commandValidation.command!.isWriteCommand,
    },
    'Command validated successfully'
  );

  return {
    isValid: true,
    command: commandValidation.command,
    validatedParams: paramValidation.validatedParams,
  };
}
