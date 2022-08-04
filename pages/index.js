import { useMoralisQuery, useMoralis } from "react-moralis"
import { useQuery } from "@apollo/client"

import NftBox from "components/nft-box"
import { GET_ACTIVE_ITEMS } from "graphql/active-items"
import networkMapping from "../constants/network-mapping.json"

export default function Home() {
    const { isWeb3Enabled, chainId } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    const marketplaceAddress = networkMapping[chainString].NftMarketplace[0]

    const { loading, error, data } = useQuery(GET_ACTIVE_ITEMS)

    return (
        <div className="container mx-auto">
            <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    loading || !data ? (
                        <div>Loading...</div>
                    ) : (
                        data.activeItems.map((nft) => {
                            const { price, nftAddress, tokenId, seller } = nft
                            return (
                                <NftBox
                                    price={price}
                                    nftAddress={nftAddress}
                                    tokenId={tokenId}
                                    marketplaceAddress={marketplaceAddress}
                                    seller={seller}
                                    key={`${nftAddress}:${tokenId}`}
                                />
                            )
                        })
                    )
                ) : (
                    <div>Web3 currently Not Enabled</div>
                )}
            </div>
        </div>
    )
}
