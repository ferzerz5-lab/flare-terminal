// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract InvoiceRegistry {
    enum Status { Boarding, Cleared, Flagged }

    struct Invoice {
        address issuer;
        address token;
        uint256 expectedAmount;
        uint256 paidAmount;
        string counterparty;
        Status status;
        bool exists;
    }

    mapping(string => Invoice) public invoices;
    string[] public invoiceIds;

    event InvoiceCreated(
        string invoiceId,
        address indexed issuer,
        address token,
        uint256 expectedAmount,
        string counterparty
    );

    event InvoicePaid(
        string invoiceId,
        address indexed payer,
        uint256 amount,
        Status status
    );

    function createInvoice(
        string calldata invoiceId,
        address token,
        uint256 expectedAmount,
        string calldata counterparty
    ) external {
        require(!invoices[invoiceId].exists, "Invoice already exists");

        invoices[invoiceId] = Invoice({
            issuer: msg.sender,
            token: token,
            expectedAmount: expectedAmount,
            paidAmount: 0,
            counterparty: counterparty,
            status: Status.Boarding,
            exists: true
        });

        invoiceIds.push(invoiceId);
        emit InvoiceCreated(invoiceId, msg.sender, token, expectedAmount, counterparty);
    }

    /// @notice Called by the payer AFTER sending the FXRP directly to the issuer's wallet.
    /// Marks the invoice Cleared if the amount matches, Flagged otherwise.
    function markPaid(string calldata invoiceId, uint256 amount) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.exists, "Invoice not found");
        require(inv.status == Status.Boarding, "Invoice already settled");

        inv.paidAmount = amount;
        inv.status = (amount == inv.expectedAmount) ? Status.Cleared : Status.Flagged;

        emit InvoicePaid(invoiceId, msg.sender, amount, inv.status);
    }

    function getInvoiceCount() external view returns (uint256) {
        return invoiceIds.length;
    }

    function getInvoiceIdAt(uint256 index) external view returns (string memory) {
        return invoiceIds[index];
    }
}
