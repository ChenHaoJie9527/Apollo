import {
	createContext,
	type FunctionComponent,
	type ReactNode,
	useContext,
} from "react";

type CreateContextHookReturnType<T> = [
	Context: FunctionComponent<{ children: ReactNode }>,
	useContextHook: () => T,
];

/**
 * Creates a context hook factory that supports React hooks in the context value function.
 * Perfect for game development scenarios like hotkey management, weapon switching, and UI state.
 *
 * @param useContextValue - A hook function that returns the context value (can use React hooks)
 * @param defaultValue - Optional default value for the context
 *
 * @example
 * // Game hotkey system
 * const [GameHotkeysProvider, useGameHotkeys] = createContextHook(() => {
 *   const [currentWeapon, setCurrentWeapon] = useState(0);
 *
 *   useEffect(() => {
 *     const handleKeyPress = (e: KeyboardEvent) => {
 *       if (e.code === 'Digit1') setCurrentWeapon(0); // Sword
 *       if (e.code === 'Digit2') setCurrentWeapon(1); // Bow
 *     };
 *
 *     document.addEventListener('keydown', handleKeyPress);
 *     return () => document.removeEventListener('keydown', handleKeyPress);
 *   }, []);
 *
 *   return { currentWeapon, setCurrentWeapon };
 * });
 */
export const createContextHook = <T,>(
	useContextValue: () => T,
	defaultValue?: T,
): CreateContextHookReturnType<T> => {
	const Context = createContext<T | undefined>(defaultValue);

	return [
		({ children }) => {
			const value = useContextValue(); // Called from within the component, supports hooks
			return <Context.Provider value={value}>{children}</Context.Provider>;
		},
		() => {
			const context = useContext(Context);
			if (context === undefined) {
				throw new Error(
					"useContextHook must be used within the corresponding Context Provider",
				);
			}
			return context;
		},
	];
};
