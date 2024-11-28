// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract MarketplaceV2 {
    enum ItemState {
        Create,
        Paid,
        Delivered       
    }

    struct Item {
        string name;
        uint256 price;
        address owner;
        ItemState state;
        bool isHidden;
        string imageURL; // URL của hình ảnh trên Pinata/IPFS
        bool isDeleted; // Thêm thuộc tính để kiểm tra xem sản phẩm đã bị xóa
    }

    uint256 private _itemId; // ID cho mỗi item
    mapping(uint256 => Item) public items; // Lưu trữ danh sách item

    event ItemUpdate(uint256 itemId, ItemState itemState);

    // Trả về tổng số item đã được tạo
    function totalSupply() public view returns (uint256) {
        return _itemId;
    }

    // Tạo một item mới với tên, giá và URL hình ảnh
    function createItem(string memory name, uint256 price, string memory imageURL) public {
        require(bytes(name).length > 0, "MarketplaceV2: Item name cannot be empty!"); // Kiểm tra tên không được rỗng
        require(price > 0, "MarketplaceV2: Price must be greater than zero!"); // Giá phải lớn hơn 0
        require(bytes(imageURL).length > 0, "MarketplaceV2: Image URL cannot be empty!"); // URL ảnh không được rỗng

        items[_itemId] = Item(name, price, msg.sender, ItemState.Create, false, imageURL, false);
        emit ItemUpdate(_itemId, ItemState.Create); // Phát sự kiện sau khi item được tạo
        _itemId++; // Tăng ID item sau mỗi lần tạo
        
    }
    // Thêm hàm để xóa sản phẩm
    function deleteItem(uint256 itemId) external {
        Item storage item = items[itemId];
        require(item.owner == msg.sender, "MarketplaceV2: Only the owner can delete the item"); // Chỉ chủ sở hữu mới có thể xóa item
        require(item.state == ItemState.Create, "MarketplaceV2: Item cannot be deleted once paid or delivered!"); // Kiểm tra trạng thái
        delete items[itemId]; // Xóa item
        item.isDeleted = true; // Đánh dấu item là đã xóa
    }


    // Mua một item với ID cụ thể
    function purchaseItem(uint256 itemId) public payable {
        Item storage item = items[itemId];
        require(!item.isHidden, "MarketplaceV2: Item is hidden!"); // Kiểm tra xem item có bị ẩn không
        require(item.price == msg.value, "MarketplaceV2: Only full payment accepted!"); // Kiểm tra số tiền trả đúng bằng giá item
        require(item.state == ItemState.Create, "MarketplaceV2: Item has been purchased!"); // Kiểm tra trạng thái item
        require(item.owner != msg.sender, "MarketplaceV2: The buyer cannot be the seller!"); // Người mua không thể là chủ sở hữu

        payable(item.owner).transfer(item.price); // Chuyển tiền cho chủ sở hữu hiện tại
        item.owner = msg.sender; // Cập nhật chủ sở hữu mới
        item.state = ItemState.Paid; // Cập nhật trạng thái sau khi thanh toán
        emit ItemUpdate(itemId, ItemState.Paid); // Phát sự kiện sau khi thanh toán
    }

    // Đánh dấu item đã giao
    // Khách hàng đánh dấu item là đã nhận
    function markReceived(uint256 itemId) external {
        Item storage item = items[itemId];
        require(item.owner == msg.sender, "MarketplaceV2: Only the buyer can mark the item as received!");
        require(item.state == ItemState.Paid, "MarketplaceV2: Item must be paid before marking as received!");

        item.state = ItemState.Delivered; // Cập nhật trạng thái sau khi giao hàng
        emit ItemUpdate(itemId, ItemState.Delivered); // Phát sự kiện sau khi giao hàng
    }
    // Ẩn item
    function hideItem(uint256 itemId) external {
        Item storage item = items[itemId];
        require(msg.sender == item.owner, "MarketplaceV2: Only the owner can hide the item"); // Chỉ chủ sở hữu mới có thể ẩn item
        item.isHidden = true; // Đánh dấu item đã bị ẩn
    }

    // Hiện item
    function unhideItem(uint256 itemId) external {
        Item storage item = items[itemId];
        require(msg.sender == item.owner, "MarketplaceV2: Only the owner can unhide the item"); // Chỉ chủ sở hữu mới có thể hiện item
        item.isHidden = false; // Đánh dấu item đã được hiện
    }
}