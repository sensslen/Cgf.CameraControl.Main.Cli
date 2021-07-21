import { Atem } from 'atem-connection';
import { ILogger } from '../Logger/ILogger';

interface AtemConnection {
    ip: string;
    atem: Atem;
    instanceCount: number;
}

export class AtemConnectionFactory {
    private static _connections: Array<AtemConnection> = new Array<AtemConnection>();

    public static get(ip: string, logger: ILogger): Atem {
        const connection = AtemConnectionFactory.connectionByIp(ip);
        if (connection) {
            connection.instanceCount++;
            return connection.atem;
        } else {
            const atem = new Atem();
            atem.on('info', (toLog) => AtemConnectionFactory.log(toLog, logger));
            atem.on('error', (toLog) => AtemConnectionFactory.logError(toLog, logger));
            atem.connect(ip);
            AtemConnectionFactory._connections.push({ ip: ip, atem: atem, instanceCount: 1 });
            return atem;
        }
    }

    public static lose(atem: Atem): void {
        const connection = AtemConnectionFactory.connectionByAtem(atem);
        if (connection) {
            connection.instanceCount--;
            if (connection.instanceCount < 1) {
                AtemConnectionFactory.disconnectAndRemove(connection);
            }
        }
    }

    private static disconnectAndRemove(connection: AtemConnection) {
        connection.atem.disconnect();
        const index = AtemConnectionFactory._connections.indexOf(connection, 0);
        if (index > -1) {
            AtemConnectionFactory._connections.splice(index, 1);
        }
    }

    private static connectionByIp(ip: string): AtemConnection | undefined {
        for (const connection of AtemConnectionFactory._connections) {
            if (connection.ip === ip) {
                return connection;
            }
        }
        return undefined;
    }

    private static connectionByAtem(atem: Atem): AtemConnection | undefined {
        for (const connection of AtemConnectionFactory._connections) {
            if (connection.atem === atem) {
                return connection;
            }
        }
        return undefined;
    }

    private static log(toLog: string, logger: ILogger): void {
        logger.log(`Atem: ${toLog}`);
    }

    private static logError(toLog: string, logger: ILogger): void {
        logger.error(`Atem: ${toLog}`);
    }
}