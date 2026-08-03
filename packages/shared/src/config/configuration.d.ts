declare const _default: () => {
    port: number;
    nodeEnv: string;
    database: {
        url: string | undefined;
    };
    jwt: {
        accessSecret: string | undefined;
        refreshSecret: string | undefined;
        accessExpiry: string;
        refreshExpiry: string;
    };
    cors: {
        origin: string;
    };
    throttler: {
        ttl: number;
        limit: number;
    };
    redis: {
        host: string;
        port: number;
        password: string;
    };
    tenant: {
        mode: string;
    };
};
export default _default;
