/**
 * A screen to manage the request of authentication once the pin of the user's CIE has been inserted+
 * TODO: deve essere un overlay sullo screen di richiesta pin, per evitare che si possa navigare a questo screen
 * TODO: quando si ritorna al pin, cosa fare? si potrebbe pulire l'input o metter eun tasto 'pulisci'
 * es: si potrebbe pulire solo quando ci si arriva cliccando "riprova" e il pin era sicurametne errato
 *
 * //TODO: quando fa il controllo, controllare che sia ancora attivo l'NFC, altrimenti ritornare indietro alla schermata di lettura dell'NFC
 */
import { View } from "native-base";
import * as React from "react";
import { Alert, NavState, StyleSheet } from "react-native";
import WebView from "react-native-webview";
import { cieAuthenticationUri } from "../../config";
import I18n from "../../i18n";
import { withLoadingSpinner } from "../helpers/withLoadingSpinner";
import GenericErrorComponent from "../screens/GenericErrorComponent";
import TopScreenComponent from "../screens/TopScreenComponent";

type Props = {
  ciePin: string;
  onClose: () => void;
  onSuccess: (ciePin: string, authorizationUri: string) => void;
};

type State = {
  hasError: boolean;
  isLoading: boolean;
  findOpenApp: boolean;
  webViewKey: number;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1
  }
});

class CieRequestAuthenticationOverlay extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isLoading: true,
      findOpenApp: false,
      webViewKey: 1
    };
  }

  private handleNavigationStateChange = (event: NavState): void => {
    // TODO: check if we can distinguish among different type of errors
    //      some errors could suggest ro redirect the user to the landing screen , not back
    if (event.url && event.url.indexOf("errore") !== -1) {
      this.setState({
        isLoading: false,
        hasError: true
      });
    }

    if (this.state.findOpenApp) {
      return;
    }
    // Once the returned url conteins the "OpenApp" string, then the authorization has been given
    if (event.url && event.url.indexOf("OpenApp") !== -1) {
      this.setState({ findOpenApp: true });
      const authorizationUri = event.url;
      this.props.onSuccess(this.props.ciePin, authorizationUri);
    }
  };

  private handleWebViewError = () => {
    this.setState({ hasError: true });
  };

  private renderError = () => {
    return (
      <GenericErrorComponent
        onRetry={this.handleOnRetry}
        onCancel={this.handleGoBack}
        image={require("../../../img/broken-link.png")} // TODO: use custom or generic image?
        text={I18n.t("authentication.errors.network.title")} // TODO: use custom or generic text?
      />
    );
  };

  // Updating the webView key its content is refreshed
  private handleOnRetry = () => {
    const webViewKey = this.state.webViewKey + 1;
    this.setState({
      webViewKey,
      hasError: false,
      isLoading: true
    });
  };

  // Going back the user should insert the pin again
  private handleGoBack = () => {
    if (!this.state.isLoading) {
      this.props.onClose();
    } else {
      Alert.alert(I18n.t("authentication.cie.pin.alert"), undefined, [
        {
          text: I18n.t("global.buttons.cancel"), // TODO: validate button name - the action is a cancel, it could be confusing
          style: "cancel"
        },
        {
          text: I18n.t("global.buttons.confirm"),
          style: "default",
          onPress: this.props.onClose
        }
      ]);
    }
  };

  private renderWebView() {
    if (this.state.hasError) {
      return this.renderError();
    }
    return (
      <View style={styles.flex}>
        <WebView
          javaScriptEnabled={true}
          onError={this.handleWebViewError}
          onNavigationStateChange={this.handleNavigationStateChange}
          source={{
            uri: cieAuthenticationUri
          }}
          key={this.state.webViewKey}
        />
      </View>
    );
  }

  public render(): React.ReactNode {
    const ContainerComponent = withLoadingSpinner(() => (
      <TopScreenComponent>{this.renderWebView()}</TopScreenComponent>
    ));
    return (
      <ContainerComponent
        isLoading={this.state.isLoading}
        loadingOpacity={1.0}
        loadingCaption={I18n.t("global.genericWaiting")}
        onCancel={this.handleGoBack}
      />
    );
  }
}

export default CieRequestAuthenticationOverlay;