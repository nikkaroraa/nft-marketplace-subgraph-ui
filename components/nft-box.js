import { useState, useEffect } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"

import nftMarketplaceAbi from "../constants/abi/NftMarketplace.json"
import nftAbi from "../constants/abi/BasicNft.json"
import UpdateListingModal from "./update-listing-modal"

const truncateStr = (fullStr, strLen) => {
    if (fullStr.length <= strLen) return fullStr

    const separator = "..."
    const separatorLength = separator.length
    const charsToShow = strLen - separatorLength
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)
    return (
        fullStr.substring(0, frontChars) +
        separator +
        fullStr.substring(fullStr.length - backChars)
    )
}

export default function NftBox({ price, nftAddress, tokenId, marketplaceAddress, seller }) {
    const { isWeb3Enabled, account } = useMoralis()
    const [imageUri, setImageUri] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [showModal, setShowModal] = useState(false)

    const hideModal = () => setShowModal(false)
    const dispatch = useNotification()

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: { tokenId },
    })

    const { runContractFunction: buyItem } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
        },
    })

    useEffect(() => {
        async function updateUi() {
            // get the tokenUri
            // using the image tag from the tokenUri, get the image
            const tokenURI = await getTokenURI()
            if (tokenURI) {
                // IPFS Gateway: A server that will return IPFS files from a normal URL
                const requestUrl = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
                const tokenUriResponse = await (await fetch(requestUrl)).json()
                const imageUri = tokenUriResponse.image
                const imageUriUrl = imageUri.replace("ipfs://", "https://ipfs.io/ipfs/")
                setImageUri(imageUriUrl)
                setTokenName(tokenUriResponse.name)
                setTokenDescription(tokenUriResponse.description)
            }
        }
        if (isWeb3Enabled) {
            updateUi()
        }
    }, [isWeb3Enabled, getTokenURI])

    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15)

    const handleCardClick = () => {
        isOwnedByUser
            ? setShowModal(true)
            : buyItem({
                  onError: (error) => console.log(error),
                  onSuccess: handleBuyItemSuccess,
              })
    }

    const handleBuyItemSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Item bought!",
            title: "Item Bought",
            position: "topR",
        })
    }

    return (
        <div>
            <div>
                {imageUri ? (
                    <div>
                        <UpdateListingModal
                            isVisible={showModal}
                            tokenId={tokenId}
                            marketplaceAddress={marketplaceAddress}
                            nftAddress={nftAddress}
                            onClose={hideModal}
                        />
                        <Card title={tokenName} description={tokenDescription}>
                            <div className="p-2">
                                <div className="flex flex-col items-end gap-2 ">
                                    <div>#{tokenId}</div>
                                    <div className="italic text-sm">
                                        Owned by {formattedSellerAddress}
                                    </div>
                                    <Image
                                        alt={tokenName}
                                        loader={() => imageUri}
                                        src={imageUri}
                                        height="200"
                                        width="200"
                                        onClick={handleCardClick}
                                    />
                                    <div className="font-bold">
                                        {ethers.utils.formatUnits(price, "ether")} ETH
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        </div>
    )
}
