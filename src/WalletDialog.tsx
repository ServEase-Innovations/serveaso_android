import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';

interface WalletDialogProps {
  open: boolean;
  onClose: () => void;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
}

interface Transaction {
  id: number;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

const WalletDialog: React.FC<WalletDialogProps> = ({ open, onClose }) => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchWalletData();
    }
  }, [open]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with your actual customer ID or get it from context/auth
      const customerId = 1; // This should come from your auth context
      
      // Try the main wallet endpoint first
      try {
        const response = await axios.get(
          `https://payments-j5id.onrender.com/api/customers/${customerId}/wallet`
        );
        
        if (response.data) {
          setWalletData(response.data);
        } else {
          // If no data, create a default wallet structure
          setWalletData({
            balance: 0,
            transactions: []
          });
        }
      } catch (apiError: any) {
        if (apiError.response?.status === 404) {
          // Wallet doesn't exist yet, create a default one
          console.log("Wallet not found, creating default wallet data");
          setWalletData({
            balance: 0,
            transactions: []
          });
        } else {
          throw apiError; // Re-throw other errors
        }
      }
    } catch (error: any) {
      console.error("Error fetching wallet data:", error);
      setError(error.response?.data?.message || 'Failed to fetch wallet data');
      
      // Create default data even on error to prevent UI breakage
      setWalletData({
        balance: 0,
        transactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return 'arrow-down-circle';
      case 'DEBIT':
        return 'arrow-up-circle';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return '#10b981'; // Green for credits
      case 'DEBIT':
        return '#ef4444'; // Red for debits
      default:
        return '#6b7280';
    }
  };

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
           <LinearGradient
                                  colors={["#0a2a66ff", "#004aadff"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.linearGradient}
                                >
          <View style={styles.header}>
             <TouchableOpacity onPress={onClose}
             style={styles.closeButton}
             >
              <Icon name="close" size={30} color="#f2f2f2ff" />
            </TouchableOpacity>
            <Text style={styles.headtitle}>Wallet</Text>
          
          </View>
          </LinearGradient>
         

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading wallet data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorSubtext}>
                Showing placeholder data. Please try again later.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.content}>
              {/* Balance Card */}
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceAmount}>
                  {formatCurrency(walletData?.balance || 0)}
                </Text>
                <View style={styles.balanceActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Icon name="plus-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Add Money</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.withdrawButton]}>
                    <Icon name="bank-transfer" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Withdraw</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Transactions */}
              <View style={styles.transactionsSection}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                
                {walletData?.transactions && walletData.transactions.length > 0 ? (
                  walletData.transactions.map((transaction) => (
                    <View key={transaction.id} style={styles.transactionItem}>
                      <View style={styles.transactionIcon}>
                        <Icon
                          name={getTransactionIcon(transaction.type)}
                          size={24}
                          color={getTransactionColor(transaction.type)}
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(transaction.date)}
                        </Text>
                        <Text style={styles.transactionStatus}>
                          {transaction.status}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: getTransactionColor(transaction.type) }
                        ]}
                      >
                        {transaction.type === 'CREDIT' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyTransactions}>
                    <Icon name="receipt" size={48} color="#9ca3af" />
                    <Text style={styles.emptyTransactionsText}>
                      No transactions yet
                    </Text>
                    <Text style={styles.emptyTransactionsSubtext}>
                      Your transactions will appear here
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
    linearGradient: {
    // padding: 20,
    // borderTopLeftRadius: 12,
    // borderTopRightRadius: 12,
  },
  headtitle: {
    paddingTop: 6,
    paddingLeft: 110,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 16,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorSubtext: {
    marginTop: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  withdrawButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  transactionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionStatus: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTransactionsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyTransactionsSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default WalletDialog;