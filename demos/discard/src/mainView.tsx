import { useSelector as useReduxSelector, TypedUseSelectorHook } from "react-redux";
import { RootState  } from "./store";
import { HandView } from "./handView";
import { CardView } from "./cardView";

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
        <div style={{ height: 200, textAlign: "center" }}>
            <HandView key={"others"} cards={ new Array(deckViewModel.value.othersHand).fill(undefined) } />
        </div>
        <div style={{ height: 200, display: "flex", flexDirection: "row", justifyContent: "center" }}>
            <div style={{ display: deckViewModel.value.drawPile > 0 ? "block" : "none", margin: 5 }}>
                <span>{deckViewModel.value.drawPile} card(s)</span>
                <CardView card={ undefined } />
            </div>
            <div style={{ display: deckViewModel.value.discardPile.length > 0 ? "block" : "none", margin: 5 }}>
                <span>{deckViewModel.value.discardPile} card(s)</span>
                <CardView card={ deckViewModel.value.discardPile[0] } />
            </div>
        </div>
        <div style={{ height: 200, textAlign: "center"  }}>
            <HandView key={"mine"} cards={ deckViewModel.value.myCards } />
        </div>
    </div>
}
