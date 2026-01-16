import { Coin, MsgExecuteContract, MsgSend } from "@/delphi-labs/shuttle-react";
import { isCw20 } from "@/hooks/helpers/helpers";

export const executeContract = (
  contract: string,
  msg: any,
  funds: Coin[] = []
) => {
  return new MsgExecuteContract({
    sender: "",
    contract,
    msg,
    funds,
  });
};
export const executeContractWithAllowance = (
  contract: string,
  msg: any,
  fund: Coin
) => {
  if (isCw20(fund.denom)) {
    return [
      new MsgExecuteContract({
        sender: "",
        contract: fund.denom,
        msg: {
          increase_allowance: {
            amount: fund.amount,
            spender: contract,
          },
        },
        funds: [],
      }),
      new MsgExecuteContract({
        sender: "",
        contract,
        msg,
        funds: [],
      }),
    ];
  }

  return new MsgExecuteContract({
    sender: "",
    contract,
    msg,
    funds: [fund],
  });
};
export const executeOrSendContract = (
  contract: string,
  msg: any,
  fund: Coin
) => {
  if (isCw20(fund.denom)) {
    throw new Error("not supported yet");
  } else {
    return new MsgExecuteContract({
      sender: "",
      contract,
      msg,
      funds: [fund],
    });
  }
};

export const sendNftContract = (
  collection: string,
  token_id: string,
  contract: string,
  msg: any
) => {
  return new MsgExecuteContract({
    sender: "",
    contract: collection,
    msg: {
      send_nft: {
        contract: contract,
        token_id: token_id,
        msg: to_base64(msg),
      },
    },
    funds: [],
  });
};

export const executeTransfer = (funds: Coin[], from: string, to: string) => {
  return new MsgSend({
    amount: funds,
    toAddress: to,
    fromAddress: from,
  });
};
function to_base64(msg: any) {
  const jsonStr = JSON.stringify(msg);
  return Buffer.from(jsonStr).toString("base64");
}
