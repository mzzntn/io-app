import * as React from "react";
import pagoBancomatImage from "../../../../../../img/wallet/cards-icons/pagobancomat.png";
import { PatchedWalletV2 } from "../../../../../types/pagopa";
import { HPan } from "../../store/actions/paymentMethods";
import { hasBpdCapability } from "../../utils";
import PaymentMethodBpdToggle from "./base/PaymentMethodBpdToggle";

type Props = {
  card: PatchedWalletV2;
};

/**
 * Customize a {@link PaymentMethodBpdToggle} with the data from a Bancomat
 * @param props
 * @constructor
 */
export const BancomatBpdToggle: React.FunctionComponent<Props> = props => (
  <PaymentMethodBpdToggle
    hPan={props.card.info.hashPan as HPan}
    icon={pagoBancomatImage}
    hasBpdCapability={hasBpdCapability(props.card)}
    // TODO: load bank name and displayhere
    caption={`bank name here!`}
  />
);
