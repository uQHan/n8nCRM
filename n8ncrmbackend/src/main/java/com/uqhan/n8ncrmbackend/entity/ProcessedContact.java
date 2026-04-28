package com.uqhan.n8ncrmbackend.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "processed_contacts")
public class ProcessedContact {
	@Id
	@GeneratedValue
	@UuidGenerator
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "job_id", nullable = false)
	private ProcessingJob job;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "original_data")
	private String originalData;

	@Size(max = 500)
	private String name;

	@Size(max = 320)
	@Column(nullable = false, unique = true)
	private String email;

	@Size(max = 50)
	private String phone;

	@Size(max = 500)
	private String company;

	@Size(max = 255)
	private String title;

	@Size(max = 1000)
	private String address;

	@Size(max = 255)
	private String city;

	@Size(max = 255)
	private String state;

	@Size(max = 255)
	private String country;

	@Size(max = 20)
	private String zip;

	@Size(max = 2048)
	private String website;

	@Column(name = "email_verified")
	private Boolean emailVerified;

	@Column(name = "email_deliverable")
	private Boolean emailDeliverable;

	@Size(max = 500)
	@Column(name = "company_domain")
	private String companyDomain;

	// --- Fields that were missing from the entity but present in the DB schema ---

	@Size(max = 255)
	@Column(name = "company_size")
	private String companySize;

	@Size(max = 255)
	@Column(name = "company_industry")
	private String companyIndustry;

	@Size(max = 500)
	@Column(name = "company_location")
	private String companyLocation;

	// --- End of previously missing fields ---

	@Size(max = 50)
	@Column(name = "phone_formatted")
	private String phoneFormatted;

	@Column(name = "phone_valid")
	private Boolean phoneValid;

	private Boolean enriched;

	@Column(name = "is_duplicate")
	private Boolean duplicate;

	@Column(name = "duplicate_of")
	private UUID duplicateOf;

	@Column(name = "data_quality_score")
	private Integer dataQualityScore;

	@Column(name = "created_at", insertable = false, updatable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", insertable = false, updatable = false)
	private OffsetDateTime updatedAt;

	public UUID getId() {
		return id;
	}

	public ProcessingJob getJob() {
		return job;
	}

	public void setJob(ProcessingJob job) {
		this.job = job;
	}

	public String getOriginalData() {
		return originalData;
	}

	public void setOriginalData(String originalData) {
		this.originalData = originalData;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getCompany() {
		return company;
	}

	public void setCompany(String company) {
		this.company = company;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getCity() {
		return city;
	}

	public void setCity(String city) {
		this.city = city;
	}

	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	public String getCountry() {
		return country;
	}

	public void setCountry(String country) {
		this.country = country;
	}

	public String getZip() {
		return zip;
	}

	public void setZip(String zip) {
		this.zip = zip;
	}

	public String getWebsite() {
		return website;
	}

	public void setWebsite(String website) {
		this.website = website;
	}

	public Boolean getEmailVerified() {
		return emailVerified;
	}

	public void setEmailVerified(Boolean emailVerified) {
		this.emailVerified = emailVerified;
	}

	public Boolean getEmailDeliverable() {
		return emailDeliverable;
	}

	public void setEmailDeliverable(Boolean emailDeliverable) {
		this.emailDeliverable = emailDeliverable;
	}

	public String getCompanyDomain() {
		return companyDomain;
	}

	public void setCompanyDomain(String companyDomain) {
		this.companyDomain = companyDomain;
	}

	public String getCompanySize() {
		return companySize;
	}

	public void setCompanySize(String companySize) {
		this.companySize = companySize;
	}

	public String getCompanyIndustry() {
		return companyIndustry;
	}

	public void setCompanyIndustry(String companyIndustry) {
		this.companyIndustry = companyIndustry;
	}

	public String getCompanyLocation() {
		return companyLocation;
	}

	public void setCompanyLocation(String companyLocation) {
		this.companyLocation = companyLocation;
	}

	public String getPhoneFormatted() {
		return phoneFormatted;
	}

	public void setPhoneFormatted(String phoneFormatted) {
		this.phoneFormatted = phoneFormatted;
	}

	public Boolean getPhoneValid() {
		return phoneValid;
	}

	public void setPhoneValid(Boolean phoneValid) {
		this.phoneValid = phoneValid;
	}

	public Boolean getEnriched() {
		return enriched;
	}

	public void setEnriched(Boolean enriched) {
		this.enriched = enriched;
	}

	public Boolean getDuplicate() {
		return duplicate;
	}

	public void setDuplicate(Boolean duplicate) {
		this.duplicate = duplicate;
	}

	public UUID getDuplicateOf() {
		return duplicateOf;
	}

	public void setDuplicateOf(UUID duplicateOf) {
		this.duplicateOf = duplicateOf;
	}

	public Integer getDataQualityScore() {
		return dataQualityScore;
	}

	public void setDataQualityScore(Integer dataQualityScore) {
		this.dataQualityScore = dataQualityScore;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}

	public OffsetDateTime getUpdatedAt() {
		return updatedAt;
	}
}
