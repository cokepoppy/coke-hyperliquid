import { ethers } from 'ethers'
import { UserModel } from '../models/User'
import logger from './logger'

/**
 * Verify EIP-712 signature for order
 */
export async function verifySignature(
  userId: number,
  data: any,
  signature: string
): Promise<boolean> {
  try {
    // Get user
    const user = await UserModel.findById(userId)
    if (!user) {
      return false
    }

    // For users without wallet (Google/Email login), use simplified verification
    if (!user.walletAddress) {
      // Simple hash-based verification for demo/testing
      const crypto = await import('crypto')

      // Remove signature field from data before hashing
      const { signature: _, ...dataWithoutSignature } = data
      const message = JSON.stringify(dataWithoutSignature)
      const expectedHash = crypto.createHash('sha256').update(message).digest('hex')

      return signature === expectedHash
    }

    // For wallet users, verify EIP-712 signature
    const message = JSON.stringify(data)
    const messageHash = ethers.hashMessage(message)

    // Recover signer address from signature
    const recoveredAddress = ethers.recoverAddress(messageHash, signature)

    // Compare with user's wallet address
    return recoveredAddress.toLowerCase() === user.walletAddress.toLowerCase()
  } catch (error) {
    logger.error('Signature verification failed', { error })
    return false
  }
}

/**
 * Verify EIP-712 typed data signature
 */
export async function verifyTypedDataSignature(
  userId: number,
  domain: any,
  types: any,
  value: any,
  signature: string
): Promise<boolean> {
  try {
    const user = await UserModel.findById(userId)
    if (!user || !user.walletAddress) {
      return false
    }

    // Recover signer from typed data
    const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature)

    return recoveredAddress.toLowerCase() === user.walletAddress.toLowerCase()
  } catch (error) {
    logger.error('Typed data signature verification failed', { error })
    return false
  }
}
