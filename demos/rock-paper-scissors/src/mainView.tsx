import { useSelector as useReduxSelector, TypedUseSelectorHook } from "react-redux";
import { ButtonsView } from "./buttonsView";
import { RootState  } from "./store";
import { playRound } from "./model";

export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

export const MainView = () => {
    const idSelector = useSelector((state) => state.id);
    const otherPlayer = useSelector((state) => state.otherPlayer);
    const gameStateSelector = useSelector((state) => state.gameStatus);

    return <div>
        <div>
        <p>Id: {idSelector.value}</p>
        <p>Other player: {otherPlayer.value}</p>
        <p>Status: {gameStateSelector.value}</p>
        </div>
        <ButtonsView disabled={gameStateSelector.value === "Waiting"} onPlay={playRound}></ButtonsView>
    </div>
}
