import * as lnService from 'ln-service';
import { LndClient } from '../../lnd/client';
import { Config } from '../../config';
import logger from '../../utils/logger';
import { formatResponse, createMcpError, sanitizeForLogging } from '../utils';
import { validateCommandAndParameters, ALLOWED_COMMANDS } from '../validators/commandValidator';
import { parseBooleanEnv } from '../utils';

/**
 * Execute LND Command Tool
 *
 * This tool allows executing safe LND commands through the MCP server.
 * It validates commands against a whitelist and ensures parameters are valid.
 */
export class ExecuteLndCommandTool {
  private client: LndClient;
  private allowWriteCommands: boolean;

  /**
   * Initialize the tool with LND client and configuration
   * @param client LND client instance
   * @param _config Application configuration (not used directly)
   */
  constructor(client: LndClient, _config: Config) {
    this.client = client;
    this.allowWriteCommands = parseBooleanEnv(process.env.ALLOW_WRITE_COMMANDS, false);

    logger.info(
      { allowWriteCommands: this.allowWriteCommands },
      'ExecuteLndCommandTool initialized'
    );
  }

  /**
   * Get the list of allowed commands
   * @returns List of allowed commands with descriptions
   */
  getAllowedCommands(): { name: string; description: string; isWriteCommand: boolean }[] {
    return Object.entries(ALLOWED_COMMANDS).map(([name, command]) => ({
      name,
      description: command.description,
      isWriteCommand: command.isWriteCommand,
    }));
  }

  /**
   * Execute an LND command
   * @param commandName Name of the command to execute
   * @param params Parameters for the command
   * @returns Result of the command execution
   */
  async executeCommand(commandName: string, params: Record<string, any> = {}): Promise<string> {
    try {
      logger.debug(
        { command: commandName, params: sanitizeForLogging(params) },
        'Executing LND command'
      );

      // Validate command and parameters
      const validation = validateCommandAndParameters(commandName, params, this.allowWriteCommands);

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const { command, validatedParams } = validation;

      // Get LND instance
      const lnd = this.client.getLnd();

      // Execute the command
      // We need to use dynamic access to ln-service methods
      const lnServiceMethod = command!.lnServiceMethod;
      const method = (lnService as any)[lnServiceMethod];

      if (typeof method !== 'function') {
        throw new Error(`LND method '${lnServiceMethod}' not found in ln-service`);
      }

      // Execute the command with the validated parameters and LND instance
      const result = await method({
        lnd,
        ...validatedParams,
      });

      logger.debug(
        { command: commandName, result: sanitizeForLogging(result) },
        'LND command executed successfully'
      );

      // Format the response
      return formatResponse(result);
    } catch (error) {
      logger.error(
        { command: commandName, params: sanitizeForLogging(params), error },
        'Failed to execute LND command'
      );
      throw createMcpError(error, `Failed to execute LND command '${commandName}'`);
    }
  }
}
