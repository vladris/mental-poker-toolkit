import { useSelector as useReduxSelector, TypedUseSelectorHook } from "react-redux";
import { RootState  } from "./store";
import { HandView } from "./handView";
import { CardView } from "./cardView";
import { discardCard, drawCard } from "./model";
import { matchSuitOrValue } from "./deck";

export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

export const MainView = () => {
    const idSelector = useSelector((state) => state.id);
    const otherPlayer = useSelector((state) => state.otherPlayer);
    const gameStateSelector = useSelector((state) => state.gameStatus);
    const deckViewModel = useSelector((state) => state.deckViewModel);

    const myTurn = gameStateSelector.value === "MyTurn";

    // Checks whether we can discard a card
    const canDiscard = (index: number) => {
        // Can discard anything if there's nothing on the discard pile
        if (deckViewModel.value.discardPile.length === 0) {
            return true;
        }

        return matchSuitOrValue(
            deckViewModel.value.myCards[index],
            deckViewModel.value.discardPile[deckViewModel.value.discardPile.length - 1]);
    }

    return <div>
        <div>
            <p>Id: {idSelector.value}</p>
            <p>Other player: {otherPlayer.value}</p>
            <p>Status: {gameStateSelector.value}</p>
        </div>
        <div style={{ height: 200, textAlign: "center" }}>
            <HandView prefix={"others"} cards={ new Array(deckViewModel.value.othersHand).fill(undefined) } />
        </div>
        <div style={{ height: 200, display: "flex", flexDirection: "row", justifyContent: "center" }}>
            <div style={{ display: deckViewModel.value.drawPile > 0 ? "block" : "none", margin: 5 }} onClick={() => { if (myTurn) { drawCard()} }}>
                <span>{deckViewModel.value.drawPile} card{deckViewModel.value.drawPile !== 1 ? "s" : ""}</span>
                <CardView card={ undefined } />
            </div>
            <div style={{ display: deckViewModel.value.discardPile.length > 0 ? "block" : "none", margin: 5 }}>
                <span>{deckViewModel.value.discardPile.length} card{deckViewModel.value.discardPile.length !== 1 ? "s" : ""}</span>
                <CardView card={ deckViewModel.value.discardPile[deckViewModel.value.discardPile.length - 1] } />
            </div>
        </div>
        <div style={{ height: 200, textAlign: "center" }}>
            <HandView
                prefix={"mine"}
                cards={ deckViewModel.value.myCards }
                onClick={(index) => { if (myTurn && canDiscard(index)) { discardCard(index) } }} />
        </div>
    </div>
}
