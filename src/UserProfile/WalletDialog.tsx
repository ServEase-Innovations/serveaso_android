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
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAppUser } from '../context/AppUserContext';
import PaymentInstance from '../services/paymentInstance';

interface WalletDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Transaction {
  transaction_id: number;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
  status: string;
}

interface Wallet {
  balance: number;
  transactions: Transaction[];
  rewards: number;
}

const WalletDialog: React.FC<WalletDialogProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { appUser } = useAppUser();

  // Fallback dummy wallet
  const walletData = {
    balance: 5420,
    transactions: [
      {
        transaction_id: 1,
        transaction_type: 'credit',
        amount: 2000,
        description: 'Home Cook Service',
        created_at: 'Aug 28, 2025',
        status: 'Completed',
      },
      {
        transaction_id: 2,
        transaction_type: 'debit',
        amount: 1500,
        description: 'Maid Service',
        created_at: 'Aug 25, 2025',
        status: 'Completed',
      },
    ],
    rewards: 450,
  };

  useEffect(() => {
    if (open && appUser?.customerid) {
      fetchWalletData();
    }
  }, [open, appUser]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching wallet for user:', appUser?.customerid);

      const response = await PaymentInstance.get(`/api/wallets/${appUser?.customerid}`);
      
      console.log('Wallet API Response:', response.data);
      setWallet(response.data);
      
    } catch (error: any) {
      console.error('Wallet fetch error:', error);
      setError(error.response?.data?.message || 'Failed to fetch wallet data');
      
      // Use fallback data on error
      setWallet(walletData);
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
      case 'credit':
        return 'arrow-down-circle';
      case 'debit':
        return 'arrow-up-circle';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return '#10b981'; // Green for credits
      case 'debit':
        return '#ef4444'; // Red for debits
      default:
        return '#6b7280';
    }
  };

  const renderTransactions = () => {
    const transactions = wallet?.transactions || walletData.transactions;
    
    return transactions.map((transaction) => (
      <View key={transaction.transaction_id} style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          <Icon
            name={getTransactionIcon(transaction.transaction_type)}
            size={24}
            color={getTransactionColor(transaction.transaction_type)}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{transaction.description}</Text>
          <Text style={styles.transactionMeta}>
            {formatDate(transaction.created_at)} • {transaction.status}
          </Text>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            { color: getTransactionColor(transaction.transaction_type) }
          ]}
        >
          {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount}
        </Text>
      </View>
    ));
  };

  const renderRewards = () => (
    <View style={styles.rewardsContainer}>
      <Text style={styles.sectionTitle}>Your Rewards</Text>
      <View style={styles.rewardsCard}>
        <View style={styles.rewardsHeader}>
          <Text style={styles.rewardsIcon}>⭐</Text>
          <Text style={styles.rewardsPoints}>
            {wallet?.rewards ?? walletData.rewards} Points
          </Text>
        </View>
        <Text style={styles.rewardsDescription}>
          Earn more points by completing services and referring friends
        </Text>
        <TouchableOpacity style={styles.rewardsButton}>
          <Text style={styles.rewardsButtonText}>View Rewards Catalog</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!open) return null;

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={["#0a2a66ff", "#004aadff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.linearGradient}
        >
          <View style={styles.header}>
          
            <Text style={styles.headtitle}>My Wallet</Text>

              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#f2f2f2ff" />
            </TouchableOpacity>
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
                ₹{wallet ? wallet.balance : walletData.balance}
              </Text>
              <View style={styles.balanceButtons}>
                <TouchableOpacity style={styles.addMoneyButton}>
                  <Text style={styles.addMoneyText}>➕ Add Money</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.transferButton}>
                  <Text style={styles.transferText}>🔄 Transfer</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
                onPress={() => setActiveTab('transactions')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'transactions' && styles.activeTabText,
                  ]}
                >
                  Transactions
                </Text>
                {activeTab === 'transactions' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
                onPress={() => setActiveTab('rewards')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'rewards' && styles.activeTabText,
                  ]}
                >
                  Rewards
                </Text>
                {activeTab === 'rewards' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'transactions' ? (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <ScrollView style={styles.transactionsList}>
                  {renderTransactions()}
                </ScrollView>
              </View>
            ) : (
              renderRewards()
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  linearGradient: {
    // padding: 20,
    // borderTopLeftRadius: 12,
    // borderTopRightRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    // marginRight: 24, // To balance the close button space
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
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
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    color: '#dbeafe',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  balanceButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addMoneyButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addMoneyText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
  transferButton: {
    flex: 1,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  transferText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    // Active state handled by text and indicator
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#2563eb',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#2563eb',
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  transactionsList: {
    maxHeight: 256,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  transactionMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  rewardsContainer: {
    flex: 1,
  },
  rewardsCard: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rewardsIcon: {
    fontSize: 20,
  },
  rewardsPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  rewardsDescription: {
    fontSize: 14,
    color: '#fef3c7',
    textAlign: 'center',
    marginBottom: 16,
  },
  rewardsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rewardsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default WalletDialog;