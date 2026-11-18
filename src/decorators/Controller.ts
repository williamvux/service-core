export type ControllerClass = new (...args: never[]) => object;

const controllers = new Set<ControllerClass>();

export function Controller() {
    return (target: ControllerClass, _context: ClassDecoratorContext): void => {
        controllers.add(target);
    };
}

export const registeredControllers = (): ControllerClass[] => [...controllers];
