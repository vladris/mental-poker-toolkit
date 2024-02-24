import { getLedger } from "@mental-poker-toolkit/demo-transport";
import ReactDOM from "react-dom/client";
import { randomClientId, upgradeTransport } from "@mental-poker-toolkit/primitives";
import { Action, Context, TestAction } from "./model";
import { ButtonsView } from "./buttonsView";

type MainViewProps = { context: Context };

function MainView(props: MainViewProps) {
    const { context } = props;

    return (<div style={{ display: "block" }}>
        <div>
            <p>ID: {context.clientId}</p>
        </div>
        <ButtonsView onPlay={(s) => {console.log(s)}}></ButtonsView>
        <div>
            <p>Status: { context.gameStatus} </p>
        </div>
    </div>)
}

getLedger<Action>().then((ledger) => {
    const root = ReactDOM.createRoot(document.getElementById("root")!);
    
    const context: Context = {
        clientId: randomClientId(),
        transport: ledger,
        myPlay: "",
        theirPlay: "",
        gameStatus: "Waiting"
    };

    upgradeTransport(context.clientId, ledger).then((ledger) => {
        context.transport = ledger;

        ledger.on("actionPosted", (v) => {
            if (v.type === "TestAction") {
                console.log(`${v.clientId}: ${(v as TestAction).value}`)
            }
        })
        ledger.postAction({ clientId: context.clientId, type: "TestAction", value: "Test"});
    });

    root.render(
        <MainView context={context}></MainView>
    );
});
