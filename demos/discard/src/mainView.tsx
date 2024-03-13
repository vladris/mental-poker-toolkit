import { useSelector as useReduxSelector, TypedUseSelectorHook } from "react-redux";
import { RootState  } from "./store";

export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

export const MainView = () => {
    return <div>
        <p>Hello world</p>
    </div>
}
