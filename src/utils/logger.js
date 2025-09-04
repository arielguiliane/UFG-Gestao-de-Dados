/**
 * Sistema de Logging
 * Utilitário para logs coloridos e organizados
 */

export class Logger {
    constructor() {
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m'
        };
    }

    formatarTimestamp() {
        return new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    info(mensagem, ...args) {
        console.log(
            `${this.colors.cyan}[INFO]${this.colors.reset} ` +
            `${this.colors.bright}${this.formatarTimestamp()}${this.colors.reset} - ` +
            `${mensagem}`,
            ...args
        );
    }

    success(mensagem, ...args) {
        console.log(
            `${this.colors.green}[SUCCESS]${this.colors.reset} ` +
            `${this.colors.bright}${this.formatarTimestamp()}${this.colors.reset} - ` +
            `${this.colors.green}${mensagem}${this.colors.reset}`,
            ...args
        );
    }

    warn(mensagem, ...args) {
        console.warn(
            `${this.colors.yellow}[WARN]${this.colors.reset} ` +
            `${this.colors.bright}${this.formatarTimestamp()}${this.colors.reset} - ` +
            `${this.colors.yellow}${mensagem}${this.colors.reset}`,
            ...args
        );
    }

    error(mensagem, ...args) {
        console.error(
            `${this.colors.red}[ERROR]${this.colors.reset} ` +
            `${this.colors.bright}${this.formatarTimestamp()}${this.colors.reset} - ` +
            `${this.colors.red}${mensagem}${this.colors.reset}`,
            ...args
        );
    }

    debug(mensagem, ...args) {
        if (process.env.NODE_ENV === 'development') {
            console.log(
                `${this.colors.magenta}[DEBUG]${this.colors.reset} ` +
                `${this.colors.bright}${this.formatarTimestamp()}${this.colors.reset} - ` +
                `${this.colors.magenta}${mensagem}${this.colors.reset}`,
                ...args
            );
        }
    }
}
