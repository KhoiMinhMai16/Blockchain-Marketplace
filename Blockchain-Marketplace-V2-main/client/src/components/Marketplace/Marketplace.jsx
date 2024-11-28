import { useCallback, useEffect, useState } from "react";
import { useEth } from "../../contexts/EthContext";
import axios from "axios";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { PinataSDK } from "pinata";

const ITEM_STATE = {
    Created: '0',
    Paid: '1',
    Delivered: '2',
};


export function Marketplace(props) {
    const { state: { accounts, contract } } = useEth();
    const [buyerName, setBuyerName] = useState('');
    const [buyerPhone, setBuyerPhone] = useState('');
    const [buyerAddress, setBuyerAddress] = useState('');
    const [buyerNote, setBuyerNote] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [listItem, setListItem] = useState([]);
    const [error, setError] = useState('');
    const [showHidden, setShowHidden] = useState(false);
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const PINATA_API_KEY = "5c166ab3c8c1b8c68f81";
    const PINATA_SECRET_API_KEY = "c57351d88d495c4c353783af5680a8344b769641897d569f1390350349290ca8";

    const pinata = new PinataSDK({
        pinataJwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhOTM4YWMwYy1hZmYyLTQyYjAtYTZkMi1kNzQyNjg5MTBiZTciLCJlbWFpbCI6Imtob2k5NDU1OEBkb25nYS5lZHUudm4iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNWMxNjZhYjNjOGMxYjhjNjhmODEiLCJzY29wZWRLZXlTZWNyZXQiOiJjNTczNTFkODhkNDk1YzRjMzUzNzgzYWY1NjgwYTgzNDRiNzY5NjQxODk3ZDU2OWYxMzkwMzUwMzQ5MjkwY2E4IiwiZXhwIjoxNzYyMDY4OTc3fQ.0RvMfRwdr8D8T6oXZGD_p9COpNgovJZnz6cIk31tmRo",
        pinataGateway: "https://api.pinata.cloud/pinning/pinFileToIPFS",
    });

    const getListItem = useCallback(async () => {
        if (!contract) return;
        try {
            const totalSupply = await contract.methods.totalSupply().call();
            const totalSupplyNumber = Number(totalSupply);
            const _ListItem = [];

            for (let itemId = 0; itemId < totalSupplyNumber; itemId++) {
                const item = await contract.methods.items(itemId).call();
                const { name, owner, price, state, isHidden, imageURL, isDeleted } = item;
                if (!isDeleted) {
                    _ListItem.push({ name, owner, price, state, id: itemId, isHidden, imageURL });
                }
            }
            setListItem(_ListItem);
        } catch (err) {
            console.error("Error fetching list items:", err);
            setError("Failed to fetch items. Please try again later.");
        }
    }, [contract]);

    useEffect(() => {
        if (contract) getListItem();
    }, [contract, getListItem]);

    const validateInputs = () => {
        setError('');
        if (!newItemName || !newItemPrice || !selectedFile) {
            setError("All fields, including the image, are required.");
            return false;
        }
        if (newItemName.length < 3 || newItemName.length > 100) {
            setError("Item name should be between 3 and 100 characters.");
            return false;
        }
        if (isNaN(newItemPrice) || Number(newItemPrice) <= 0) {
            setError("Price must be a positive number.");
            return false;
        }
        return true;
    };

    const createItem = async () => {
        if (!validateInputs() || !contract || !accounts) return;
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        const formData = new FormData();
        formData.append('file', selectedFile);
        setError('');
        try {
            const res = await axios.post(url, formData, {
                headers: {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_API_KEY,
                    "Content-Type": "multipart/form-data"
                },
            });
            const imageURL = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
            await contract.methods.createItem(newItemName, Number(newItemPrice), imageURL)
                .send({ from: accounts[0] });
            getListItem();
            setNewItemName('');
            setNewItemPrice('');
            setSelectedFile(null);
        } catch (err) {
            console.error("Error creating item:", err);
            setError(`Failed to create item. Error: ${err.message}`);
        }
    };

    const purchaseItem = async (itemId, itemPrice) => {
        if (!contract || !accounts) return;
        try {
            const uploadJson = await pinata.upload.json({
                itemIndex: itemId,
                address: buyerAddress,
                name: buyerName,
                phone: buyerPhone,
                note: buyerNote,
            })
            .addMetadata({
                name: itemId + ".json",
            })
            await contract.methods.purchaseItem(itemId).send({ from: accounts[0], value: itemPrice });
            handleClose()
            getListItem();
        } catch (err) {
            console.error("Error purchasing item:", err);
            setError("Failed to purchase item. Please try again.");
        }
    };

    const loadItems = useCallback(async () => {
        if (contract) {
            await getListItem();
        }
    }, [contract, getListItem]);
    
    

    const triggerReceived = async (itemId) => {
        if (!contract || !accounts) return;
        try {
            await contract.methods.markReceived(itemId).send({ from: accounts[0] });
            loadItems();  // Call loadItems to refresh the list
        } catch (error) {
            console.error("Failed to mark item as received:", error);
            setError("Failed to mark item as received. Please try again.");
        }
    };
    
    const hideItem = async (itemId) => {
        if (!contract || !accounts) return;
        try {
            await contract.methods.hideItem(itemId).send({ from: accounts[0] });
            getListItem();
        } catch (err) {
            console.error("Error hiding item:", err);
            setError("Failed to hide item. Please try again.");
        }
    };

    const deleteItem = async (itemId) => {
        if (!contract || !accounts) return;
        try {
            await contract.methods.deleteItem(itemId).send({ from: accounts[0] });
            getListItem();
        } catch (err) {
            console.error("Error deleting item:", err.message);
            setError("Failed to delete item. Please try again.");
        }
    };

    const unhideItem = async (itemId) => {
        if (!contract || !accounts) return;
        try {
            await contract.methods.unhideItem(itemId).send({ from: accounts[0] });
            getListItem();
        } catch (err) {
            console.error("Error unhiding item:", err);
            setError("Failed to unhide item. Please try again.");
        }
    };

    const toggleHiddenItems = () => {
        setShowHidden(prev => !prev);
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    return (
        <div className="container" style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Algerian, sans-serif', fontSize: '36px', fontWeight: 'bold' }}>
                Marketplace
            </h1>
            <p className="contract-address">
                Contract address: {contract?.options?.address}
                <br />
                Your address: {accounts && accounts.length > 0 ? accounts[0] : 'Not connected'}
            </p>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className='bg-red rounded-3 shadow-sm p-3'>
                <div className="create-item">Create item</div>
                <input
                    className='form-control my-3'
                    type='text'
                    placeholder='Item name'
                    value={newItemName}
                    onChange={event => setNewItemName(event.target.value)}
                />
                <input
                    className='form-control my-3'
                    type='text'
                    placeholder='Item price'
                    value={newItemPrice}
                    onChange={event => setNewItemPrice(event.target.value)}
                />
                <input
                    className='form-control my-3'
                    type='file'
                    onChange={handleFileChange}
                />
                <div className='btn btn-primary create-button' onClick={createItem}>
                    Create
                </div>
            </div>

            <div className='bg-white rounded-3 shadow-sm p-3 mt-3'>
                <div className='row'>
                    {listItem
                        .filter(item => showHidden ? true : !item.isHidden)
                        .map(item => (
                            <div className='col-6 col-lg-3' key={item.id}>
                                <div className='rounded-3 shadow-sm border border-success'>
                                    <div className='text-center bg-success rounded-top-3 p-3'>
                                        <p className='fs-3 text-light'>
                                            {item.name}
                                            <br />
                                            Owner: 0x...{item.owner.substring(39)}
                                        </p>
                                    </div>
                                    <div className='p-2'>
                                        <img src={item.imageURL} alt={item.name} style={{ width: '100%', height: 'auto', marginBottom: '10px' }} />
                                    </div>
                                    <div className='p-2'>
                                        Price: {item.price} wei
                                    </div>

                                    <Modal show={show} onHide={handleClose}>
                                        <Modal.Header closeButton>
                                        <Modal.Title>Thông Tin Nhận Hàng</Modal.Title>
                                        </Modal.Header>
                                        <Modal.Body>
                                            <Form.Control
                                            className="mb-3"
                                            placeholder="Name"
                                            aria-label="Name"
                                            aria-describedby="basic-addon1"
                                            value={buyerName}
                                            onChange={event => setBuyerName(event.target.value)}
                                            />
                                            <Form.Control
                                                type="number"
                                                className="mb-3"
                                                placeholder="Phone"
                                                aria-label="Phone"
                                                aria-describedby="basic-addon3"
                                                value={buyerPhone}
                                                onChange={event => setBuyerPhone(event.target.value)}
                                            />
                                            <Form.Control
                                                className="mb-3"
                                                placeholder="Address"
                                                aria-label="Address"
                                                aria-describedby="basic-addon4"
                                                value={buyerAddress}
                                                onChange={event => setBuyerAddress(event.target.value)}
                                            />
                                            <Form.Control className="mb-3" 
                                            placeholder="Note" 
                                            as="textarea" 
                                            aria-label="With textarea" 
                                            value={buyerNote}
                                            onChange={event => setBuyerNote(event.target.value)}/>
                                        </Modal.Body>
                                        <Modal.Footer>
                                        <Button variant="secondary" onClick={handleClose}>
                                            Close
                                        </Button>
                                        <Button variant="primary" onClick={() => item.state === ITEM_STATE.Created && purchaseItem(item.id, item.price)}>
                                            Confirm
                                        </Button>
                                        </Modal.Footer>
                                    </Modal>
                                    <div
                                        className={`m-2 btn btn-success px-5 ${item.state === ITEM_STATE.Delivered || item.state === ITEM_STATE.Paid ? "disabled" : ""}`}
                                        onClick={handleShow}
                                    >
                                        Buy
                                    </div>
                                    {item.owner === accounts[0] && (
                                        item.isHidden ? (
                                            <div className="m-2 btn btn-success px-2" onClick={() => unhideItem(item.id)}>
                                                Unhide
                                            </div>
                                        ) : (
                                            <div className="m-2 btn btn-success px-2" onClick={() => hideItem(item.id)}>
                                                Hide
                                            </div>
                                        )
                                    )}
                                    <div
                                        className={`m-2 btn btn-success px-5 ${item.state !== ITEM_STATE.Paid ? "disabled" : ""}`}
                                        onClick={() => item.state === ITEM_STATE.Paid && triggerReceived(item.id)}
                                    >
                                        Received
                                    </div>
                                    {/* Chỉ hiển thị nút Delete cho chủ sở hữu và item chưa được mua (trạng thái Created) */}
                                    {item.owner === accounts[0] && item.state === ITEM_STATE.Created && (
                                        <div className="m-2 btn btn-danger px-2" onClick={() => deleteItem(item.id)}>
                                            Delete
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    <button
                        onClick={toggleHiddenItems}
                        style={{
                            marginTop: "10px",
                            padding: "10px",
                            border: "none",
                            borderRadius: "5px",
                            backgroundColor: "#008000",
                            color: "#1cfad5",
                        }}
                    >
                        {showHidden ? "Show Hidden Items" : "Hide Hidden Items"}
                    </button>
                </div>
            </div>
        </div>
    );
}
