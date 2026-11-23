# Security Specification — بلدنا (محافظة قنا)

## 1. Data Invariants
1. **Default Deny Safety Net**: Any unmatched path is denied (`allow read, write: if false;`).
2. **Verified Identity**: Every authenticated write requires `request.auth != null && request.auth.token.email_verified == true`.
3. **Admin-Only Governance**: Only verified admins (`abeerabdoo331@gmail.com` or `/admins/{uid}`) may create/update/delete categories, subcategories, Qena centers, villages, announcements, APK updates, approve/feature/pause listings, or block users.
4. **Moderation & Privilege Integrity**: Regular users creating a listing MUST set `status == 'pending'`, `isFeatured == false`, `isActive == true`, and `authorUid == request.auth.uid`. Blocked users (`isBlocked == true`) cannot create new listings.
5. **PII Isolation (Aid Privacy & User Profiles)**:
   - Aid requests opting for privacy store empty `contactPhone` on `/listings/{id}` (`hideContactInfo == true`) and save private contact in `/aid_contacts/{listingId}`, readable only by the owner and admins.
   - `/users/{userId}` containing phone/email is strictly restricted to owner or admin on `get` and `list`.
6. **Temporal & Relational Integrity**: `createdAt == request.time` on create; `updatedAt == request.time` on updates; immutable `createdAt`, `authorUid`, and `uid`. Parent references (`centerId` for villages, `categoryId` for listings) must reference valid defaults or existing parent docs.

## 2. The "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. **Unverified Admin Email Spoof**: Write to `/centers/fake` with `email == 'abeerabdoo331@gmail.com'` and `email_verified: false`.
2. **Self-Approved Listing**: Non-admin user creating `/listings/x` with `status: 'approved'`.
3. **Self-Featured Listing**: Non-admin user creating `/listings/x` with `isFeatured: true`.
4. **Blocked User Listing Creation**: User with `/users/{uid}.isBlocked == true` attempting to create a listing.
5. **Ghost Field / Shadow Update**: Listing update or create containing extra field `extraAdminFlag: true`.
6. **User Self-Unblock / Privilege Escalation**: User updating `/users/{uid}` attempting to change `isBlocked` from `true` to `false`.
7. **Other User PII Read**: Authenticated non-admin user attempting `get` on `/users/otherUid` or `/aid_contacts/otherListing`.
8. **Unbounded Images Attack**: Creating a listing with 4 images (`images.size() > 3`) or >140KB image string.
9. **Public Category / Village Tampering**: Non-admin attempting to create or edit `/categories/c1`, `/centers/c1`, or `/villages/v1`.
10. **Orphan Village Creation**: Admin creating `/villages/v1` with non-existent `centerId: 'unknown-governorate'`.
11. **Fake Timestamp Forgery**: Creating a listing or announcement with backdated `createdAt` instead of `request.time`.
12. **Terminal / Approved Listing Tamper by Author**: Non-admin author attempting to edit a listing after `status == 'approved'`.
