import { fromNullable } from "fp-ts/lib/Option";
import * as pot from "italia-ts-commons/lib/pot";
import { Content, H3, Text, View } from "native-base";
import * as React from "react";
import { StyleSheet } from "react-native";
import { CreatedMessageWithContentAndAttachments } from "../../../definitions/backend/CreatedMessageWithContentAndAttachments";
import { ServicePublic } from "../../../definitions/backend/ServicePublic";
import I18n from "../../i18n";
import { ServiceMetadataState } from "../../store/reducers/content";
import { PaymentByRptIdState } from "../../store/reducers/entities/payments";
import variables from "../../theme/variables";
import customVariables from "../../theme/variables";
import { paymentExpirationInfo } from "../../utils/messages";
import OrganizationHeader from "../OrganizationHeader";
import MedicalPrescriptionDueDateBar from "./MedicalPrescriptionDueDateBar";
import MedicalPrescriptionIdentifiersComponent from "./MedicalPrescriptionIdentifiersComponent";
import MessageDetailCTABar from "./MessageDetailCTABar";
import MessageDetailData from "./MessageDetailData";
import MessageDueDateBar from "./MessageDueDateBar";
import MessageMarkdown from "./MessageMarkdown";

type Props = Readonly<{
  message: CreatedMessageWithContentAndAttachments;
  paymentsByRptId: PaymentByRptIdState;
  potServiceDetail: pot.Pot<ServicePublic, Error>;
  potServiceMetadata: ServiceMetadataState;
  onServiceLinkPress?: () => void;
}>;

type State = Readonly<{
  isContentLoadCompleted: boolean;
}>;

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: variables.contentPadding
  },
  serviceContainer: {
    marginBottom: variables.contentPadding
  },
  subjectContainer: {
    marginBottom: variables.spacerSmallHeight
  },
  ctaBarContainer: {
    backgroundColor: variables.brandGray,
    padding: variables.contentPadding,
    marginBottom: variables.contentPadding
  },
  webview: {
    marginLeft: variables.contentPadding,
    marginRight: variables.contentPadding
  },
  messageIDContainer: {
    width: "100%",
    alignContent: "space-between",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap"
  },
  messageIDLabelContainer: {
    flex: 1,
    height: variables.lineHeightBase,
    marginBottom: 5
  },
  messageIDLabelText: {
    fontSize: variables.fontSizeSmaller
  },
  messageIDBtnContainer: {
    flex: 0,
    marginBottom: 5,
    height: variables.lineHeightBase
  },
  reducedText: {
    fontSize: customVariables.fontSizeSmall
  }
});

/**
 * A component to render the message detail. It has 2 main styles: traditional message and medical prescription
 */
export default class MessageDetailComponent extends React.PureComponent<
  Props,
  State
> {
  constructor(props: Props) {
    super(props);
    this.state = { isContentLoadCompleted: false };
  }

  private onMarkdownLoadEnd = () => {
    this.setState({ isContentLoadCompleted: true });
  };

  get maybeMedicalData() {
    return fromNullable(this.props.message.content.prescription_data);
  }

  get attachments() {
    return fromNullable(this.props.message.content.attachments);
  }

  get paymentExpirationInfo() {
    return paymentExpirationInfo(this.props.message);
  }

  get service() {
    const { potServiceDetail } = this.props;
    return fromNullable(
      pot.isNone(potServiceDetail)
        ? ({
            organization_name: I18n.t("messages.errorLoading.senderInfo"),
            department_name: I18n.t("messages.errorLoading.departmentInfo"),
            service_name: I18n.t("messages.errorLoading.serviceInfo")
          } as ServicePublic)
        : pot.toUndefined(potServiceDetail)
    );
  }

  get payment() {
    const { message, paymentsByRptId } = this.props;
    return this.service.fold(undefined, service => {
      if (message.content.payment_data !== undefined) {
        return paymentsByRptId[
          `${service.organization_fiscal_code}${
            message.content.payment_data.notice_number
          }`
        ];
      }
      return undefined;
    });
  }

  private getTitle = () => {
    if (this.maybeMedicalData.isSome()) {
      return (
        <React.Fragment>
          <H3>{I18n.t("messages.medical.prescription")}</H3>
          <Text style={styles.reducedText}>
            {I18n.t("messages.medical.memo")}
          </Text>
        </React.Fragment>
      );
    }

    return <H3>{this.props.message.content.subject}</H3>;
  };

  public render() {
    const {
      message,
      potServiceDetail,
      potServiceMetadata,
      onServiceLinkPress
    } = this.props;
    const { maybeMedicalData, service, payment } = this;

    return (
      <React.Fragment>
        <Content noPadded={true}>
          {/** Header */}
          <View style={styles.padded}>
            <View spacer={true} />
            {service !== undefined &&
              service.isSome() && (
                <React.Fragment>
                  {service && <OrganizationHeader service={service.value} />}
                  <View spacer={true} large={true} />
                </React.Fragment>
              )}
            {/* Subject */}
            {this.getTitle()}
            <View spacer={true} />
          </View>

          {maybeMedicalData.isSome() && (
            <MedicalPrescriptionIdentifiersComponent
              prescriptionData={maybeMedicalData.value}
            />
          )}

          {this.maybeMedicalData.isSome() ? (
            <MedicalPrescriptionDueDateBar
              message={message}
              service={service.toUndefined()}
            />
          ) : (
            <MessageDueDateBar
              message={message}
              service={service.toUndefined()}
              payment={payment}
            />
          )}

          <MessageMarkdown
            webViewStyle={styles.webview}
            onLoadEnd={this.onMarkdownLoadEnd}
          >
            {message.content.markdown}
          </MessageMarkdown>

          <View spacer={true} large={true} />

          {this.state.isContentLoadCompleted && (
            <React.Fragment>
              <MessageDetailData
                message={message}
                serviceDetail={potServiceDetail}
                serviceMetadata={potServiceMetadata}
                goToServiceDetail={onServiceLinkPress}
              />
            </React.Fragment>
          )}
        </Content>
        <View spacer={true} large={true} />
        <View spacer={true} small={true} />
        {this.maybeMedicalData.isNone() && (
          <MessageDetailCTABar
            message={message}
            service={service.toUndefined()}
            payment={this.payment}
          />
        )}
      </React.Fragment>
    );
  }
}
