export default class DI {
    private static scopes = new Map<string, () => unknown>();
    private static singletons = new Map<string, unknown>();

    public static set<T>(
        token: string,
        factory: () => T,
        singleton: boolean = false,
    ): void {
        if (this.scopes.has(token) || this.singletons.has(token)) {
            throw new Error(`Dependency ${token} is already registered.`);
        }
        if (singleton) {
            this.singletons.set(token, factory());
        } else {
            this.scopes.set(token, factory);
        }
    }

    public static get<T>(token: string): T {
        const scope = this.scopes.get(token);
        if (scope) {
            return scope() as T;
        }
        const singleton = this.singletons.get(token);

        if (!singleton) {
            throw new Error(`No dependency registered for ${token}.`);
        }
        return singleton as T;
    }
}
