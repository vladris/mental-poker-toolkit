import { useSelector as useReduxSelector, TypedUseSelectorHook } from "react-redux";
import { RootState  } from "./store";
import { HandView } from "./handView";

export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

export const MainView = () => {
    const idSelector = useSelector((state) => state.id);
    const otherPlayer = useSelector((state) => state.otherPlayer);
    const gameStateSelector = useSelector((state) => state.gameStatus);
    const deckViewModel = useSelector((state) => state.deckViewModel);

    return <div>
        <div>
            <p>Id: {idSelector.value}</p>
            <p>Other player: {otherPlayer.value}</p>
            <p>Status: {gameStateSelector.value}</p>
        </div>
        <HandView cards={ new Array(deckViewModel.value.othersHand).fill(undefined) } />
        <HandView cards={ deckViewModel.value.myCards } />
    </div>
}
